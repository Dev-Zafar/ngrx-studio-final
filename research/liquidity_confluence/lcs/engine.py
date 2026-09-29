"""Candidate filtering (scoring, HTF, RR, cost) and 5-minute execution engine.

Conservative execution conventions (fixed a priori):
  * Orders are worked from the first 5m bar opening at/after the 15m decision
    bar's close -> no look-ahead.
  * Prices are treated as mid.  A buy limit at P fills only if low <= P - half
    spread (the ask reached P); a sell limit needs high >= P + half spread.
  * Stops trigger on the bid/ask and fill with extra slippage (gaps fill at
    the open, i.e. worse).
  * If stop and target are both touched inside one 5m bar -> STOP first.
  * A limit-entry fill bar may stop out but may NOT take profit.
  * If the invalidation (price beyond the impulse extreme) and the fill occur in
    the same bar, the order is treated as cancelled.
  * One position per market; a newer setup replaces an unfilled order.
  * Daily loss limit: once realised R for the UTC day <= -2R, no new orders.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

from .config import Params, CostModel, TRADE_WINDOWS
from .news import in_blackout

NS_MIN = 60_000_000_000
NS_DAY = 1440 * NS_MIN

REMOVED_POINTS = {"use_sweep": 1, "use_htf": 2, "use_bos": 1, "use_displacement": 1,
                  "use_fvg": 2, "use_ob": 2, "use_fib": 1}


def score(c: pd.DataFrame, p: Params) -> pd.Series:
    s = (c.k_sweep.astype(int)
         + (p.use_htf & (c.t1 == 1)).astype(int)
         + (p.use_bos & c.k_bos).astype(int)
         + (p.use_displacement & c.k_strong).astype(int)
         + c.k_fvg.astype(int)
         + (c.k_ob & c.k_ob_caused).astype(int)
         + c.k_overlap.astype(int)
         + (p.use_fib & c.k_fib).astype(int)
         + c.k_pd.astype(int)
         + c.k_session.astype(int)
         + (p.use_htf & (c.t1 == 1) & (c.t4 == 1)).astype(int)
         + c.k_external.astype(int))
    return s


def effective_min_score(p: Params) -> int:
    removed = sum(v for k, v in REMOVED_POINTS.items() if not getattr(p, k))
    # OB and FVG share the overlap point; do not remove it twice
    if not p.use_fvg and not p.use_ob:
        removed -= 1
    return p.min_score - removed


def effective_exit(p: Params) -> str:
    if not p.use_liq_targets and p.exit_mode in ("tp2", "partial"):
        return "rr2.0"
    return p.exit_mode


def in_window(t_ns: np.ndarray, session: str):
    """Returns (mask, window_end_ns) for decision times."""
    wins = TRADE_WINDOWS[session]
    day0 = (t_ns // NS_DAY) * NS_DAY
    minute = (t_ns - day0) / NS_MIN
    mask = np.zeros(len(t_ns), bool)
    wend = np.full(len(t_ns), np.iinfo(np.int64).max, dtype=np.int64)
    for a, b in wins:
        m = (minute >= a * 60) & (minute < b * 60)
        mask |= m
        wend = np.where(m, day0 + b * 60 * NS_MIN, wend)
    return mask, wend


def prepare(cands: pd.DataFrame, p: Params, cost: CostModel,
            t_start: Optional[int] = None, t_end: Optional[int] = None) -> pd.DataFrame:
    """Apply mandatory filters + scoring. Returns candidates ready for the engine."""
    if cands is None or len(cands) == 0:
        return pd.DataFrame()
    c = cands
    if t_start is not None:
        c = c[(c.t_dec >= t_start) & (c.t_dec < t_end)]
    if p.model != "both":
        c = c[c.model == p.model]
    if len(c) == 0:
        return pd.DataFrame()
    c = c.copy()
    d = c.dir.values
    c["sl"] = c.origin - d * p.sl_buffer_atr * c.atr
    c["risk"] = d * (c.entry - c.sl)
    c = c[c.risk > 0]
    c["score"] = score(c, p)
    htf_ok = (~np.bool_(p.use_htf)) | (c.t1 == 1) | (c.t4 == 1) | \
        ((c.model == "reversal") & c.ext_liq & p.use_sweep)
    c["rr_tp2"] = c.dir * (c.tp2 - c.entry) / c.risk
    ok = htf_ok & (c.score >= effective_min_score(p))
    if p.use_liq_targets:
        ok &= c.rr_tp2 >= p.min_rr_to_tp2
    hs = np.array([cost.hs(x) for x in c.entry])
    sl_ = np.array([cost.slip(x) for x in c.entry])
    c["est_cost_r"] = (2 * hs + sl_ + (cost.maker_fee + cost.taker_fee) * c.entry) / c.risk
    ok &= c.est_cost_r <= p.max_cost_r
    c = c[ok]
    session = p.session if p.use_session_filter else "all"
    m, wend = in_window(c.t_dec.values, session)
    c = c[m].copy()
    c["t_deadline"] = np.minimum(c.t_exp.values, wend[m])
    # one candidate per decision time: keep the higher score
    c = c.sort_values(["t_dec", "score"], ascending=[True, False])
    c = c.drop_duplicates("t_dec", keep="first")
    return c.reset_index(drop=True)


@dataclass
class Bars:
    t: np.ndarray
    o: np.ndarray
    h: np.ndarray
    l: np.ndarray
    c: np.ndarray

    @classmethod
    def from_df(cls, df: pd.DataFrame) -> "Bars":
        return cls(df.index.asi8.astype(np.int64), df.open.values.astype(float),
                   df.high.values.astype(float), df.low.values.astype(float),
                   df.close.values.astype(float))


def _first(mask: np.ndarray) -> int:
    k = int(np.argmax(mask)) if len(mask) else 0
    return k if len(mask) and mask[k] else -1


def _stop_fill(b: Bars, j, d, stop, hs, slip):
    if d == 1:
        return min(b.o[j] - hs, stop) - slip
    return max(b.o[j] + hs, stop) + slip


def _exit_fixed(b: Bars, s, e, d, stop, tp, hs, slip, allow_first_tp):
    """Vectorised stop/target search on bars [s, e)."""
    if d == 1:
        sh = b.l[s:e] <= stop + hs
        th = b.h[s:e] >= tp + hs
    else:
        sh = b.h[s:e] >= stop - hs
        th = b.l[s:e] <= tp - hs
    if not allow_first_tp and len(th):
        th = th.copy(); th[0] = False
    js, jt = _first(sh), _first(th)
    if js >= 0 and (jt < 0 or js <= jt):
        return s + js, _stop_fill(b, s + js, d, stop, hs, slip), "sl", False
    if jt >= 0:
        return s + jt, tp, "tp", True
    j = e - 1
    return j, b.c[j] - d * (hs + slip), "time", False


def _exit_loop(b: Bars, s, e, d, ef, stop, risk, hs, slip, mode, tp1, tp3, atr_,
               allow_first_tp):
    """Partial (50% TP1 -> BE -> TP3) and trailing (after 1R) exits.
    Returns list of (fraction, bar, price, reason, is_limit)."""
    legs = []
    rem = 1.0
    best = ef
    for j in range(s, e):
        hit_stop = (b.l[j] <= stop + hs) if d == 1 else (b.h[j] >= stop - hs)
        if hit_stop:
            reason = "sl" if (stop - ef) * d < 0 else ("be" if stop == ef else "trail")
            legs.append((rem, j, _stop_fill(b, j, d, stop, hs, slip), reason, False))
            return legs
        can_tp = allow_first_tp or j > s
        if mode == "partial":
            if rem == 1.0 and can_tp and ((b.h[j] >= tp1 + hs) if d == 1 else (b.l[j] <= tp1 - hs)):
                legs.append((0.5, j, tp1, "tp1", True))
                rem = 0.5
                stop = ef                              # breakeven from next bar
            if rem == 0.5 and can_tp and ((b.h[j] >= tp3 + hs) if d == 1 else (b.l[j] <= tp3 - hs)):
                legs.append((0.5, j, tp3, "tp3", True))
                return legs
        else:  # trail
            best = max(best, b.h[j]) if d == 1 else min(best, b.l[j])
            if (best - ef) * d >= risk:
                new = best - d * 2.0 * atr_
                stop = max(stop, ef, new) if d == 1 else min(stop, ef, new)
    j = e - 1
    legs.append((rem, j, b.c[j] - d * (hs + slip), "time", False))
    return legs


def simulate(pc: pd.DataFrame, bars: Bars, p: Params, cost: CostModel,
             blackout=None) -> pd.DataFrame:
    """Run the prepared candidates through the 5m engine; return trades."""
    if pc is None or len(pc) == 0:
        return pd.DataFrame()
    exit_mode = effective_exit(p)
    rr = float(exit_mode[2:]) if exit_mode.startswith("rr") else None
    max_hold = int(p.max_hold_hours * 60 * NS_MIN)
    T = bars.t
    n = len(pc)
    cols = {k: pc[k].values for k in ("t_dec", "t_deadline", "dir", "entry", "sl", "risk",
                                      "tp1", "tp2", "tp3", "impulse_end", "atr")}
    if "entry_type" in pc:
        etype = pc["entry_type"].values
    else:
        etype = np.full(n, "limit" if p.entry_mode == "limit" else "confirm", dtype=object)
    if "tp_fixed_r" in pc:
        tpr = pc["tp_fixed_r"].values
    else:
        tpr = np.full(n, np.nan)
    bo_s, bo_e = blackout if blackout is not None else (np.array([], np.int64),) * 2
    rows = []
    free_t = -1
    day_r = {}
    for k in range(n):
        t0 = cols["t_dec"][k]
        if t0 < free_t:
            continue
        if day_r.get(t0 // NS_DAY, 0.0) <= -p.daily_loss_limit_r:
            continue
        d = int(cols["dir"][k]); entry = cols["entry"][k]; stop = cols["sl"][k]
        hs, slip = cost.hs(entry), cost.slip(entry)
        deadline = cols["t_deadline"][k]
        if k + 1 < n:
            deadline = min(deadline, cols["t_dec"][k + 1])       # replaced by newer setup
        s = int(np.searchsorted(T, t0, side="left"))
        e = int(np.searchsorted(T, deadline, side="left"))
        if s >= e or s >= len(T):
            continue
        bo = in_blackout(T[s:e], bo_s, bo_e) if p.news_filter else np.zeros(e - s, bool)
        et = etype[k]
        cancel_lvl = cols["impulse_end"][k]
        if d == 1:
            cancel = bars.h[s:e] > cancel_lvl
        else:
            cancel = bars.l[s:e] < cancel_lvl
        if et == "market":
            f = s
            ef = bars.o[f] + d * (hs + slip)
            fee_in = cost.taker_fee
            allow_first = True
        else:
            touch_px = entry - d * hs if et == "limit" else entry
            touch = (bars.l[s:e] <= touch_px) if d == 1 else (bars.h[s:e] >= touch_px)
            touch &= ~bo
            jf, jc = _first(touch), _first(cancel)
            if jf < 0 or (0 <= jc <= jf):
                continue
            f = s + jf
            if et == "limit":
                ef = entry
                fee_in = cost.maker_fee
                allow_first = False
            else:  # confirmation on 5m after the touch
                end_c = min(f + p.confirm_window_5m, len(T) - 1)
                bconf = -1
                for j in range(f, end_c):
                    stopped = (bars.l[j] <= stop) if d == 1 else (bars.h[j] >= stop)
                    if stopped:
                        break
                    if j > 0 and ((d == 1 and bars.c[j] > bars.o[j] and bars.c[j] > bars.h[j - 1]) or
                                  (d == -1 and bars.c[j] < bars.o[j] and bars.c[j] < bars.l[j - 1])):
                        bconf = j
                        break
                if bconf < 0 or bconf + 1 >= len(T):
                    continue
                f = bconf + 1
                if p.news_filter and in_blackout(T[f:f + 1], bo_s, bo_e)[0]:
                    continue
                ef = bars.o[f] + d * (hs + slip)
                fee_in = cost.taker_fee
                allow_first = True
        risk = d * (ef - stop)
        if risk <= 0:
            continue
        if et == "confirm" and p.use_liq_targets and d * (cols["tp2"][k] - ef) / risk < p.min_rr_to_tp2:
            continue
        e_exit = int(np.searchsorted(T, T[f] + max_hold, side="left"))
        e_exit = max(min(e_exit, len(T)), f + 1)
        r_mult = tpr[k] if np.isfinite(tpr[k]) else rr
        if r_mult is not None or exit_mode == "tp2":
            tp = ef + d * r_mult * risk if r_mult is not None else cols["tp2"][k]
            j, px, reason, is_lim = _exit_fixed(bars, f, e_exit, d, stop, tp, hs, slip, allow_first)
            legs = [(1.0, j, px, reason, is_lim)]
        else:
            legs = _exit_loop(bars, f, e_exit, d, ef, stop, risk, hs, slip, exit_mode,
                              cols["tp1"][k], cols["tp3"][k], cols["atr"][k], allow_first)
        j_last = legs[-1][1]
        exit_t = T[j_last] + 5 * NS_MIN
        hold_h = (exit_t - T[f]) / (60 * NS_MIN)
        pnl = fees = 0.0
        for frac, j, px, reason, is_lim in legs:
            pnl += frac * d * (px - ef)
            fees += frac * (fee_in * ef + (cost.maker_fee if is_lim else cost.taker_fee) * px)
        funding = d * cost.funding_8h * ef * hold_h / 8.0
        r_net = (pnl - fees - funding) / risk
        day_r[exit_t // NS_DAY] = day_r.get(exit_t // NS_DAY, 0.0) + r_net
        free_t = exit_t
        rows.append(dict(
            idx=k, dir=d, entry_time=T[f], exit_time=exit_t, decision_time=t0,
            entry=ef, sl=stop, risk=risk, exit=legs[-1][2], exit_reason="+".join(x[3] for x in legs),
            R=r_net, R_pre_fee=pnl / risk, cost_R=(fees + funding) / risk, hold_h=hold_h,
            news=bool(in_blackout(np.array([T[f]]), bo_s, bo_e)[0]),
            stop_pct=risk / ef * 100, lev=(p.risk_pct / 100) / (risk / ef)))
    if not rows:
        return pd.DataFrame()
    tr = pd.DataFrame(rows)
    meta_cols = [c for c in pc.columns if c.startswith("k_") or c in (
        "model", "score", "t1", "t4", "fib_loc", "fvg_size_atr", "fvg_by_disp", "ob_size_atr",
        "ob_liq_dist_atr", "liq_kinds", "atr", "rr_tp2", "est_cost_r", "tp2_fallback", "market")]
    tr = tr.join(pc[meta_cols].reset_index(drop=True), on="idx")
    tr["sl_atr"] = tr.risk / tr.atr
    for col in ("entry_time", "exit_time", "decision_time"):
        tr[col] = pd.to_datetime(tr[col], utc=True)
    return tr
