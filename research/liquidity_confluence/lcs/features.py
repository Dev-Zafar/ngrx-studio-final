"""Causal feature primitives.

Convention: arrays are indexed by bar; a value at index i is computed only from
bars 0..i and is therefore known at the CLOSE of bar i.  Swing points carry a
separate confirmation index (pivot index + N) - they are unknown before it.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


def atr(h: np.ndarray, l: np.ndarray, c: np.ndarray, n: int = 14) -> np.ndarray:
    """Wilder ATR, causal. atr[i] uses bars <= i."""
    pc = np.concatenate([[c[0]], c[:-1]])
    tr = np.maximum(h - l, np.maximum(np.abs(h - pc), np.abs(l - pc)))
    out = np.empty_like(tr)
    out[0] = tr[0]
    a = 1.0 / n
    for i in range(1, len(tr)):
        out[i] = out[i - 1] + a * (tr[i] - out[i - 1])
    return out


@dataclass
class Swings:
    hi_idx: np.ndarray   # pivot bar index of swing highs
    hi_conf: np.ndarray  # bar index at whose close the swing high is confirmed
    lo_idx: np.ndarray
    lo_conf: np.ndarray


def fractal_swings(h: np.ndarray, l: np.ndarray, n: int) -> Swings:
    """N-bar fractal: pivot high at i if h[i] > max(h[i-n:i]) and
    h[i] >= max(h[i+1:i+n+1]).  Confirmed at the close of bar i+n."""
    N = len(h)
    hi, lo = [], []
    for i in range(n, N - n):
        if h[i] > h[i - n:i].max() and h[i] >= h[i + 1:i + n + 1].max():
            hi.append(i)
        if l[i] < l[i - n:i].min() and l[i] <= l[i + 1:i + n + 1].min():
            lo.append(i)
    hi = np.asarray(hi, dtype=np.int64)
    lo = np.asarray(lo, dtype=np.int64)
    return Swings(hi, hi + n, lo, lo + n)


@dataclass
class Structure:
    trend: np.ndarray       # +1 bullish, -1 bearish, 0 undefined (after bar i close)
    bull_break: np.ndarray  # bool: close broke above last confirmed swing high
    bear_break: np.ndarray
    bull_choch: np.ndarray  # bull_break while trend was bearish
    bear_choch: np.ndarray
    last_sh: np.ndarray     # last confirmed swing-high price known at bar i (nan)
    last_sl: np.ndarray


def market_structure(h, l, c, sw: Swings) -> Structure:
    """Mechanical BOS/CHOCH state machine.

    - Keeps the most recently CONFIRMED swing high / low.
    - Bullish break: close > last confirmed, not-yet-broken swing high.
      It is a CHOCH if the prevailing trend was bearish, else a BOS.
    - Trend = direction of the last break (equivalent to HH/HL vs LL/LH
      sequences confirmed by closes).
    """
    N = len(c)
    trend = np.zeros(N, dtype=np.int8)
    bb = np.zeros(N, bool); sb = np.zeros(N, bool)
    bc = np.zeros(N, bool); sc = np.zeros(N, bool)
    lsh = np.full(N, np.nan); lsl = np.full(N, np.nan)
    hi_by_conf = {}
    for p, k in zip(sw.hi_idx, sw.hi_conf):
        hi_by_conf.setdefault(int(k), []).append(int(p))
    lo_by_conf = {}
    for p, k in zip(sw.lo_idx, sw.lo_conf):
        lo_by_conf.setdefault(int(k), []).append(int(p))
    sh = sl = np.nan
    sh_broken = sl_broken = True
    t = 0
    for i in range(N):
        if i in hi_by_conf:
            sh = h[hi_by_conf[i][-1]]; sh_broken = False
        if i in lo_by_conf:
            sl = l[lo_by_conf[i][-1]]; sl_broken = False
        if not sh_broken and c[i] > sh:
            bb[i] = True; bc[i] = t == -1; t = 1; sh_broken = True
        if not sl_broken and c[i] < sl:
            sb[i] = True; sc[i] = t == 1; t = -1; sl_broken = True
        trend[i] = t
        lsh[i] = sh; lsl[i] = sl
    return Structure(trend, bb, sb, bc, sc, lsh, lsl)


def displacement(o, h, l, c, atr_arr, body_min, atr_mult, close_pct):
    """Displacement candle flags. Uses ATR of the PREVIOUS bar so the candle
    itself does not inflate its own benchmark."""
    rng = h - l
    body = np.abs(c - o)
    prev_atr = np.concatenate([[np.nan], atr_arr[:-1]])
    with np.errstate(invalid="ignore", divide="ignore"):
        br = np.where(rng > 0, body / rng, 0.0)
        big = rng >= atr_mult * prev_atr
        pos = np.where(rng > 0, (c - l) / rng, 0.5)
    bull = (c > o) & (br >= body_min) & big & (pos >= 1 - close_pct)
    bear = (c < o) & (br >= body_min) & big & (pos <= close_pct)
    return bull, bear


def fvgs(h, l):
    """3-candle FVGs indexed by candle C (known at close of C).
    bull[i]: l[i] > h[i-2] -> zone (h[i-2], l[i]); bear[i]: h[i] < l[i-2]."""
    N = len(h)
    bull = np.zeros(N, bool); bear = np.zeros(N, bool)
    bull[2:] = l[2:] > h[:-2]
    bear[2:] = h[2:] < l[:-2]
    return bull, bear


def map_htf_to_ltf(ltf_close_ns: np.ndarray, htf_open_ns: np.ndarray, htf_tf_ns: int,
                   values: np.ndarray, fill=0):
    """For each LTF bar (by its close time), take the value of the latest HTF
    bar whose close time <= LTF close time.  No look-ahead."""
    htf_close = htf_open_ns + htf_tf_ns
    k = np.searchsorted(htf_close, ltf_close_ns, side="right") - 1
    out = np.where(k >= 0, values[np.clip(k, 0, None)], fill)
    return out


def ns(index: pd.DatetimeIndex) -> np.ndarray:
    return index.asi8.astype(np.int64) if index.asi8.dtype != np.int64 else index.asi8


# ---------------------------------------------------------------------------
# Descriptive (NON-causal) statistics.  These deliberately look forward and
# are ONLY used for reporting FVG / OB behaviour, never for signals.
# ---------------------------------------------------------------------------
def fvg_descriptive(df15: pd.DataFrame, atr_arr: np.ndarray, disp_bull, disp_bear,
                    horizon: int = 96) -> pd.DataFrame:
    h, l = df15.high.values, df15.low.values
    bull, bear = fvgs(h, l)
    rows = []
    for i in np.where(bull | bear)[0]:
        is_bull = bool(bull[i])
        top, bot = (l[i], h[i - 2]) if is_bull else (l[i - 2], h[i])
        end = min(len(h), i + 1 + horizon)
        fl, fh = l[i + 1:end], h[i + 1:end]
        if is_bull:
            touched = np.where(fl <= top)[0]; filled = np.where(fl <= bot)[0]
        else:
            touched = np.where(fh >= bot)[0]; filled = np.where(fh >= top)[0]
        rows.append(dict(
            time=df15.index[i], dir=1 if is_bull else -1, size=top - bot,
            size_atr=(top - bot) / atr_arr[i] if atr_arr[i] > 0 else np.nan,
            by_displacement=bool(disp_bull[i - 1] if is_bull else disp_bear[i - 1]),
            retraced=len(touched) > 0, filled=len(filled) > 0,
            bars_to_fill=int(filled[0] + 1) if len(filled) else np.nan))
    return pd.DataFrame(rows)
