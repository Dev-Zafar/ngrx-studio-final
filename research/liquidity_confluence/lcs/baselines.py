"""Random control strategies (spec section 22).

Every control uses the same market, period, session window, cost model,
cost filter, one-position rule, daily loss limit and a fixed R-multiple target,
so the only thing that differs from the strategy is HOW entries are chosen.

  random_entry      random 15m bar, random direction, market entry,
                    stop = 1.0 ATR15, TP = rr
  matched_sltp      random 15m bar, direction and stop distance (in ATR) drawn
                    from the actual strategy trades, TP = rr
  random_fvg        random unfilled 15m FVG (any context), limit at the
                    proximal edge, stop beyond candle A - buffer
  random_fib        random confirmed 15m swing leg, limit at the 0.618
                    retracement, stop beyond the leg origin - buffer
  random_ob         random displacement candle's order block (no sweep, no
                    BOS, no HTF), limit at the proximal edge, stop beyond OB
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import Params, CostModel
from .data import MarketData
from .engine import Bars, in_window, simulate
from .features import atr, displacement, fractal_swings, fvgs

NS_MIN = 60_000_000_000
CONTROLS = ("random_entry", "matched_sltp", "random_fvg", "random_fib", "random_ob")


def _base_frame(t_dec, d, entry, sl, atr_, p: Params, etype, rr, t_exp=None):
    far = np.where(d == 1, np.inf, -np.inf)
    df = pd.DataFrame(dict(
        t_dec=t_dec.astype(np.int64), dir=d.astype(int), entry=entry, sl=sl, atr=atr_,
        tp1=far, tp2=far, tp3=far, impulse_end=far, entry_type=etype, tp_fixed_r=rr))
    df["risk"] = df.dir * (df.entry - df.sl)
    df["t_deadline"] = t_exp if t_exp is not None else df.t_dec + p.order_expiry_bars * 15 * NS_MIN
    return df[df.risk > 0]


class ControlPools:
    """Pre-computes the causal event pools for one market."""

    def __init__(self, md: MarketData, p: Params):
        df = md.m15
        self.o, self.h, self.l, self.c = (df[k].values for k in ("open", "high", "low", "close"))
        self.t_close = df.index.asi8 + 15 * NS_MIN
        self.atr = atr(self.h, self.l, self.c, p.atr_len)
        self.p = p
        h, l, o, c, A = self.h, self.l, self.o, self.c, self.atr
        b = p.sl_buffer_atr
        # FVG pool
        bf, sf = fvgs(h, l)
        i_b, i_s = np.where(bf)[0], np.where(sf)[0]
        self.fvg = pd.concat([
            pd.DataFrame(dict(i=i_b, dir=1, entry=l[i_b], sl=l[i_b - 2] - b * A[i_b])),
            pd.DataFrame(dict(i=i_s, dir=-1, entry=h[i_s], sl=h[i_s - 2] + b * A[i_s]))])
        # Fib pool: leg = last confirmed swing low -> swing high (and mirror)
        sw = fractal_swings(h, l, p.swing_n_15m)
        rows = []
        for hi, hc in zip(sw.hi_idx, sw.hi_conf):
            prior = sw.lo_idx[sw.lo_idx < hi]
            if len(prior):
                lo = prior[-1]; R = h[hi] - l[lo]
                rows.append((hc, 1, h[hi] - p.fib_lo * R, l[lo] - b * A[hc]))
        for lo, lc in zip(sw.lo_idx, sw.lo_conf):
            prior = sw.hi_idx[sw.hi_idx < lo]
            if len(prior):
                hi = prior[-1]; R = h[hi] - l[lo]
                rows.append((lc, -1, l[lo] + p.fib_lo * R, h[hi] + b * A[lc]))
        self.fib = pd.DataFrame(rows, columns=["i", "dir", "entry", "sl"])
        # OB pool: any displacement candle's last opposite candle
        db, ds = displacement(o, h, l, c, A, p.disp_body, p.disp_atr, p.disp_close_pct)
        rows = []
        for dd, sign in ((np.where(db)[0], 1), (np.where(ds)[0], -1)):
            for d in dd:
                for k in range(d - 1, max(d - p.ob_lookback, 0) - 1, -1):
                    if (sign == 1 and c[k] < o[k]) or (sign == -1 and c[k] > o[k]):
                        if sign == 1:
                            rows.append((d, 1, h[k], l[k] - b * A[d]))
                        else:
                            rows.append((d, -1, l[k], h[k] + b * A[d]))
                        break
        self.ob = pd.DataFrame(rows, columns=["i", "dir", "entry", "sl"])

    def _window_idx(self, t0, t1, session):
        m = (self.t_close >= t0) & (self.t_close < t1)
        ok, _ = in_window(self.t_close, session)
        return np.where(m & ok)[0]

    def sample(self, kind, n, t0, t1, session, rr, rng, strat_trades=None) -> pd.DataFrame:
        p = self.p
        if kind in ("random_entry", "matched_sltp"):
            idx = self._window_idx(t0, t1, session)
            if len(idx) == 0:
                return pd.DataFrame()
            pick = np.sort(rng.choice(idx, size=min(n, len(idx)), replace=False))
            if kind == "random_entry" or strat_trades is None or len(strat_trades) == 0:
                d = rng.choice([-1, 1], size=len(pick)); k_atr = np.ones(len(pick))
            else:
                j = rng.integers(0, len(strat_trades), size=len(pick))
                d = strat_trades.dir.values[j]; k_atr = strat_trades.sl_atr.values[j]
            px = self.c[pick]
            return _base_frame(self.t_close[pick], d, px, px - d * k_atr * self.atr[pick], self.atr[pick],
                               p, "market", rr)
        pool = {"random_fvg": self.fvg, "random_fib": self.fib, "random_ob": self.ob}[kind]
        tc = self.t_close[pool.i.values]
        ok, _ = in_window(tc, session)
        pool = pool[(tc >= t0) & (tc < t1) & ok]
        if len(pool) == 0:
            return pd.DataFrame()
        pick = pool.iloc[np.sort(rng.choice(len(pool), size=min(n, len(pool)), replace=False))]
        i = pick.i.values
        return _base_frame(self.t_close[i], pick.dir.values, pick.entry.values, pick.sl.values,
                           self.atr[i], p, "limit", rr)


def run_controls(md: MarketData, bars: Bars, p: Params, cost: CostModel, t0, t1, n_trades,
                 strat_trades, reps=200, seed=7, blackout=None) -> dict:
    pools = ControlPools(md, p)
    rr = float(p.exit_mode[2:]) if p.exit_mode.startswith("rr") else 2.0
    session = p.session if p.use_session_filter else "all"
    rng = np.random.default_rng(seed)
    out = {}
    n = max(int(n_trades), 10)
    for kind in CONTROLS:
        exps, pfs, wrs, cnt = [], [], [], []
        for _ in range(reps):
            # sample more events than trades: many limit orders never fill
            cand = pools.sample(kind, n * (1 if kind in ("random_entry", "matched_sltp") else 3),
                                t0, t1, session, rr, rng, strat_trades)
            if len(cand) == 0:
                continue
            hs = np.array([cost.hs(x) for x in cand.entry]); sl_ = np.array([cost.slip(x) for x in cand.entry])
            est = (2 * hs + sl_ + (cost.maker_fee + cost.taker_fee) * cand.entry) / cand.risk
            cand = cand[est <= p.max_cost_r].reset_index(drop=True)
            tr = simulate(cand, bars, p, cost, blackout)
            if len(tr) == 0:
                continue
            R = tr.R.values
            exps.append(R.mean()); wrs.append((R > 0).mean() * 100); cnt.append(len(R))
            gl = -R[R < 0].sum()
            pfs.append(R[R > 0].sum() / gl if gl > 0 else np.nan)
        out[kind] = dict(exp=np.array(exps), pf=np.array(pfs), wr=np.array(wrs), n=np.array(cnt))
    return out
