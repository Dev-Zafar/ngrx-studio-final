"""Setup generation (15m) - liquidity map, sweeps / continuation breaks,
displacement, BOS/CHOCH, FVG, OB, Fibonacci and targets.

Only LONG logic is written.  Shorts are produced by running the identical code
on a price-negated view of the data (high' = -low, low' = -high, ...), then
negating the resulting prices back.  This guarantees the short rules are an
exact mirror of the long rules.

Every decision at 15m bar i uses only information known at the close of bar i.
A candidate's `t_dec` is the close time of that bar; the order can only be
worked from the first 5m bar that opens at or after t_dec.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd

from .config import Params, LIQ_SESSIONS
from .data import MarketData
from .features import (atr, fractal_swings, market_structure, displacement, fvgs,
                       map_htf_to_ltf)

NS_MIN = 60 * 1_000_000_000
EXTERNAL_KINDS = {"pd", "pw", "h1", "h4"}
TP2_KINDS = {"sw15", "eq", "range", "h1"}          # opposing 15m / 1H liquidity
TP3_KINDS = {"pd", "pw", "h4", "h1"}               # PDH/PDL, PWH/PWL, HTF
SESSION_KINDS = set(LIQ_SESSIONS)


@dataclass
class View:
    """One-directional (long-logic) view of a market. sign=+1 original,
    sign=-1 negated prices (used to generate shorts)."""
    sign: int
    t_open: np.ndarray
    t_close: np.ndarray
    o: np.ndarray
    h: np.ndarray
    l: np.ndarray
    c: np.ndarray
    atr: np.ndarray
    bos: np.ndarray          # bullish break (BOS or CHOCH) at close of bar
    choch: np.ndarray
    trend15: np.ndarray
    t1: np.ndarray           # 1H trend mapped to 15m (known at 15m close)
    t4: np.ndarray
    fvg: np.ndarray          # bullish FVG ending at bar i (candle C)
    sched: Dict[int, list]   # activation bar -> [(price, kind, life)]
    sw_lo_conf: np.ndarray   # confirmation index of 15m swing lows (sorted)
    sw_lo_idx: np.ndarray
    rng_hi: np.ndarray       # max high of previous range_len bars (causal)
    rng_lo: np.ndarray


def _ohlc(df: pd.DataFrame, sign: int):
    o, h, l, c = (df[k].values.astype(float) for k in ("open", "high", "low", "close"))
    if sign == 1:
        return o, h, l, c
    return -o, -l, -h, -c


def _htf_view(df: pd.DataFrame, sign: int, n: int, tf_ns: int, t15_open, t15_close):
    o, h, l, c = _ohlc(df, sign)
    sw = fractal_swings(h, l, n)
    st = market_structure(h, l, c, sw)
    t_open = df.index.asi8
    trend = map_htf_to_ltf(t15_close, t_open, tf_ns, st.trend.astype(np.int8))
    # swing-high levels (buy-side in this view) and swing-low levels
    levels = []
    for idx_arr, conf_arr, arr in ((sw.hi_idx, sw.hi_conf, h), (sw.lo_idx, sw.lo_conf, l)):
        for p_, k in zip(idx_arr, conf_arr):
            known = t_open[k] + tf_ns                          # close of confirming bar
            a = int(np.searchsorted(t15_open, known, side="left"))
            levels.append((a, float(arr[p_])))
    return trend, levels


def build_view(md: MarketData, p: Params, sign: int) -> View:
    df = md.m15
    o, h, l, c = _ohlc(df, sign)
    t_open = df.index.asi8.astype(np.int64)
    t_close = t_open + 15 * NS_MIN
    a = atr(h, l, c, p.atr_len)
    sw = fractal_swings(h, l, p.swing_n_15m)
    st = market_structure(h, l, c, sw)
    t1, lv1 = _htf_view(md.h1, sign, p.swing_n_1h, 60 * NS_MIN, t_open, t_close)
    t4, lv4 = _htf_view(md.h4, sign, p.swing_n_4h, 240 * NS_MIN, t_open, t_close)
    bull_fvg, _ = fvgs(h, l)

    sched: Dict[int, list] = defaultdict(list)
    # 15m internal swings -> active from the bar after confirmation
    for idx_arr, conf_arr, arr in ((sw.hi_idx, sw.hi_conf, h), (sw.lo_idx, sw.lo_conf, l)):
        for p_, k in zip(idx_arr, conf_arr):
            sched[int(k) + 1].append((float(arr[p_]), "sw15", p.internal_swing_life))
    for a_, price in lv1:
        sched[a_].append((price, "h1", p.h1_swing_life))
    for a_, price in lv4:
        sched[a_].append((price, "h4", p.h4_swing_life))

    # previous day / week high-low, session high-low (UTC)
    s = pd.DataFrame({"h": h, "l": l}, index=df.index)
    day = df.index.floor("D")
    dg = s.groupby(day).agg(h=("h", "max"), l=("l", "min"))
    first_bar_of_day = pd.Series(np.arange(len(df)), index=df.index).groupby(day).first()
    for k in range(1, len(dg)):
        a_ = int(first_bar_of_day.iloc[k])
        sched[a_].append((float(dg.h.iloc[k - 1]), "pd", 96))
        sched[a_].append((float(dg.l.iloc[k - 1]), "pd", 96))
    week = (df.index - pd.to_timedelta(df.index.dayofweek, unit="D")).floor("D")
    wg = s.groupby(week).agg(h=("h", "max"), l=("l", "min"))
    first_bar_of_week = pd.Series(np.arange(len(df)), index=df.index).groupby(week).first()
    for k in range(1, len(wg)):
        a_ = int(first_bar_of_week.iloc[k])
        sched[a_].append((float(wg.h.iloc[k - 1]), "pw", 7 * 96))
        sched[a_].append((float(wg.l.iloc[k - 1]), "pw", 7 * 96))
    hours = df.index.hour
    for name, (h0, h1_) in LIQ_SESSIONS.items():
        mask = (hours >= h0) & (hours < h1_)
        if not mask.any():
            continue
        g = s[mask].groupby(day[mask]).agg(h=("h", "max"), l=("l", "min"))
        for d, row in g.iterrows():
            end_ns = (d + pd.Timedelta(hours=h1_)).value
            a_ = int(np.searchsorted(t_open, end_ns, side="left"))
            if a_ < len(df):
                sched[a_].append((float(row.h), name, p.session_level_life))
                sched[a_].append((float(row.l), name, p.session_level_life))

    rng_hi = pd.Series(h).shift(1).rolling(p.range_len).max().values
    rng_lo = pd.Series(l).shift(1).rolling(p.range_len).min().values
    order = np.argsort(sw.lo_conf)
    return View(sign, t_open, t_close, o, h, l, c, a, st.bull_break, st.bull_choch,
                st.trend, t1.astype(np.int8), t4.astype(np.int8), bull_fvg, dict(sched),
                sw.lo_conf[order], sw.lo_idx[order], rng_hi, rng_lo)


def _nearest_above(active, x, kinds):
    best = np.inf
    for lv in active:
        if lv[1] in kinds and lv[0] > x and lv[0] < best:
            best = lv[0]
    return best


def _long_pass(v: View, p: Params, market: str) -> List[dict]:
    o, h, l, c, A = v.o, v.h, v.l, v.c, v.atr
    disp, _ = displacement(o, h, l, c, A, p.disp_body, p.disp_atr, p.disp_close_pct)
    strong, _ = displacement(o, h, l, c, A, max(p.strong_body, p.disp_body),
                             max(p.strong_atr, p.disp_atr), p.disp_close_pct)
    N = len(c)
    out: List[dict] = []
    active: list = []        # [price, kind, expire_bar, born_bar]
    rev = None               # armed reversal context
    cont = None              # armed continuation context
    last_range = -10 ** 9
    warm = max(50, p.range_len + 2)

    def build(i, s, model, kinds, ref):
        s = max(s, 0)
        seg = l[s:i + 1]
        lli = s + int(np.argmin(seg))
        leg_low = l[lli]
        leg_high = h[lli:i + 1].max()
        R = leg_high - leg_low
        if R <= 0 or A[i] <= 0:
            return None
        d_idx = np.where(disp[lli:i + 1])[0]
        if p.use_displacement:
            if len(d_idx) == 0:
                return None
            d = lli + int(d_idx[0])
        else:
            body = (c - o)[lli:i + 1]
            d = lli + int(np.argmax(body))
        is_strong = bool(strong[lli:i + 1].any()) if p.use_displacement else False
        # ---- FVG within the impulse leg, still unfilled at bar i
        fvg = None
        if p.use_fvg:
            best = best_disp = None
            for C in range(lli + 2, i + 1):
                if not v.fvg[C]:
                    continue
                top, bot = l[C], h[C - 2]
                if top - bot < p.min_fvg_atr * A[i]:
                    continue
                if C < i and l[C + 1:i + 1].min() <= bot:
                    continue                                   # already filled
                best = (C, top, bot)
                if disp[C - 1]:
                    best_disp = (C, top, bot)
            fvg = best_disp or best
        # ---- Order block: last down-close candle before the displacement
        ob = None
        if p.use_ob:
            for k in range(d - 1, max(lli - 2, d - p.ob_lookback) - 1, -1):
                if k < 0:
                    break
                if c[k] < o[k]:
                    ob = (k, h[k], l[k])
                    break
        # ---- Point of interest
        overlap = False
        if fvg and ob:
            zt, zb = min(fvg[1], ob[1]), max(fvg[2], ob[2])
            if zt > zb:
                overlap = True
                poi = (zt, zb)
            else:
                poi = (fvg[1], fvg[2])
        elif fvg:
            poi = (fvg[1], fvg[2])
        elif ob:
            poi = (ob[1], ob[2])
        else:
            return None
        fib_top = leg_high - p.fib_lo * R
        fib_bot = leg_high - p.fib_hi * R
        fib_ok = poi[0] >= fib_bot and poi[1] <= fib_top
        zone = poi
        if p.use_fib:
            if not fib_ok:
                return None
            zone = (min(poi[0], fib_top), max(poi[1], fib_bot))
        entry = zone[0]
        if not (leg_low < entry < leg_high):
            return None
        tp2 = _nearest_above(active, leg_high, TP2_KINDS)
        tp2_fb = not np.isfinite(tp2)
        if tp2_fb:
            tp2 = leg_high + R
        tp3 = _nearest_above(active, tp2, TP3_KINDS)
        if not np.isfinite(tp3):
            tp3 = tp2 + R
        exp_i = min(i + p.order_expiry_bars, N - 1)
        ob_mid = (ob[1] + ob[2]) / 2 if ob else np.nan
        return dict(
            market=market, sign=v.sign, model=model, i=i,
            t_dec=int(v.t_close[i]), t_exp=int(v.t_close[exp_i]),
            entry=entry, origin=leg_low, impulse_end=leg_high, tp1=leg_high, tp2=tp2,
            tp3=tp3, tp2_fallback=tp2_fb, atr=A[i], leg_range=R,
            fib_loc=(leg_high - entry) / R,
            k_sweep=model == "reversal" and p.use_sweep,
            k_bos=bool(v.bos[i]), k_choch=bool(v.choch[i]),
            k_disp=bool(disp[d]), k_strong=is_strong,
            k_fvg=fvg is not None, k_ob=ob is not None,
            k_ob_caused=ob is not None and d - ob[0] <= 3,
            k_overlap=overlap, k_fib=bool(fib_ok),
            k_pd=bool(kinds & {"pd"}), k_session=bool(kinds & SESSION_KINDS),
            k_external=bool(kinds & {"pw", "h1", "h4"}),
            ext_liq=bool(kinds & EXTERNAL_KINDS),
            t1=int(v.t1[i]), t4=int(v.t4[i]), trend15=int(v.trend15[i]),
            fvg_size_atr=(fvg[1] - fvg[2]) / A[i] if fvg else np.nan,
            fvg_by_disp=bool(fvg is not None and disp[fvg[0] - 1]),
            ob_size_atr=(ob[1] - ob[2]) / A[i] if ob else np.nan,
            ob_liq_dist_atr=abs(ob_mid - ref) / A[i] if ob else np.nan,
            liq_kinds=",".join(sorted(kinds)),
        )

    for i in range(1, N):
        # 1. activate newly known levels
        for price, kind, life in v.sched.get(i, ()):
            if kind == "sw15":
                up = price > c[i - 1]
                for lv in active:          # equal highs / lows (same side only)
                    if lv[1] in ("sw15", "eq") and (lv[0] > c[i - 1]) == up and \
                            abs(lv[0] - price) <= p.eq_tol_atr * A[i - 1]:
                        lv[0] = max(lv[0], price) if up else min(lv[0], price)
                        lv[1] = "eq"
                        lv[2] = i + life
                        break
                else:
                    active.append([price, kind, i + life, i])
            else:
                active.append([price, kind, i + life, i])
        if i >= warm and i - last_range >= p.range_len and \
                v.rng_hi[i] - v.rng_lo[i] <= p.range_max_atr * A[i - 1]:
            active.append([v.rng_hi[i], "range", i + p.range_life, i])
            active.append([v.rng_lo[i], "range", i + p.range_life, i])
            last_range = i
        # 2. expire and detect levels traded through by this bar
        pc = c[i - 1]
        below, above, keep = [], [], []
        for lv in active:
            if lv[2] < i:
                continue
            if lv[0] < pc and l[i] < lv[0]:
                below.append(lv)
            elif lv[0] > pc and h[i] > lv[0]:
                above.append(lv)
            else:
                keep.append(lv)
        active = keep
        if i < warm:
            continue
        # 3. sell-side liquidity taken -> potential bullish sweep
        if below and p.use_sweep:
            ref = min(lv[0] for lv in below)
            kinds = {lv[1] for lv in below}
            if rev is None:
                rev = dict(start=i, ref=ref, kinds=kinds, reclaimed=False,
                           rdl=i + p.reclaim_bars, cdl=None)
            else:
                rev.update(ref=min(rev["ref"], ref), kinds=rev["kinds"] | kinds,
                           reclaimed=False, rdl=i + p.reclaim_bars)
        # 4. buy-side liquidity broken and closed beyond -> continuation
        brk = [lv for lv in above if c[i] > lv[0]]
        if brk:
            lvl = max(lv[0] for lv in brk)
            kinds = {lv[1] for lv in brk}
            if cont is None:
                cont = dict(start=i, level=lvl, kinds=kinds, dl=i + p.cont_bos_bars)
            else:
                cont.update(level=max(cont["level"], lvl), kinds=cont["kinds"] | kinds)
        triggered = False
        # 5. reversal: reclaim, then displacement + BOS/CHOCH
        if p.use_sweep and rev is not None:
            if not rev["reclaimed"]:
                if c[i] > rev["ref"]:
                    rev["reclaimed"] = True
                    rev["cdl"] = i + p.confirm_bars
                elif i >= rev["rdl"]:
                    rev = None
            elif c[i] < rev["ref"]:
                rev = None                                  # failed reclaim
            if rev is not None and rev["reclaimed"]:
                if i > rev["cdl"]:
                    rev = None
                else:
                    struct_ok = v.bos[i] if p.use_bos else disp[i]
                    if struct_ok:
                        cand = build(i, rev["start"], "reversal", rev["kinds"], rev["ref"])
                        if cand is not None:
                            out.append(cand)
                            triggered = True
                            rev = None
        elif not p.use_sweep:
            # ablation: no liquidity sweep required - any displacement + BOS
            struct_ok = v.bos[i] if p.use_bos else disp[i]
            if struct_ok:
                cand = build(i, i - p.confirm_bars, "reversal", set(), l[i])
                if cand is not None:
                    out.append(cand)
                    triggered = True
        # 6. continuation: displacement closing beyond the level + BOS
        if cont is not None:
            if i > cont["dl"]:
                cont = None
            else:
                struct_ok = v.bos[i] if p.use_bos else True
                disp_ok = True
                if p.use_displacement:
                    seg = np.arange(cont["start"], i + 1)
                    disp_ok = bool(np.any(disp[seg] & (c[seg] > cont["level"])))
                if struct_ok and disp_ok and not triggered:
                    k = np.searchsorted(v.sw_lo_conf, i, side="right") - 1
                    s0 = int(v.sw_lo_idx[k]) if k >= 0 else i - p.confirm_bars
                    s0 = max(s0, i - 4 * p.confirm_bars)
                    cand = build(i, s0, "continuation", cont["kinds"], cont["level"])
                    if cand is not None:
                        out.append(cand)
                    cont = None
                elif struct_ok and disp_ok:
                    cont = None
    return out


PRICE_COLS = ("entry", "origin", "impulse_end", "tp1", "tp2", "tp3")


def generate_candidates(md: MarketData, p: Params) -> pd.DataFrame:
    rows = []
    for sign in (1, -1):
        v = build_view(md, p, sign)
        rows.extend(_long_pass(v, p, md.market))
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    neg = df.sign == -1
    for col in PRICE_COLS:
        df.loc[neg, col] = -df.loc[neg, col]
    df["dir"] = df.sign.astype(int)
    # HTF trends in the negated view are already expressed relative to the
    # trade direction (+1 = aligned).  Keep that meaning.
    return df.sort_values(["t_dec", "dir"]).reset_index(drop=True)


# Parameters that change candidate GENERATION (used as cache key).
GEN_KEYS = ("disp_body", "disp_atr", "disp_close_pct", "swing_n_15m", "swing_n_1h",
            "swing_n_4h", "fib_lo", "fib_hi", "confirm_bars", "reclaim_bars",
            "order_expiry_bars", "use_sweep", "use_bos", "use_fvg", "use_ob", "use_fib",
            "use_displacement", "min_fvg_atr", "eq_tol_atr", "cont_bos_bars")


def gen_key(p: Params) -> tuple:
    return tuple(getattr(p, k) for k in GEN_KEYS)
