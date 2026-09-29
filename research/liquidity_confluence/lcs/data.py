"""Data loading, validation, resampling and the synthetic null-data generator.

Canonical input: one file per market with 5-minute UTC OHLCV bars
    data/<MARKET>_5m.parquet   (or .csv)
columns: time (bar OPEN time, UTC), open, high, low, close, volume
Optional: bid/ask derived column `spread` (price units) for FX.

All higher timeframes (15m, 1h, 4h) are resampled from 5m with
label='left', closed='left', so a bar stamped T covers [T, T+tf) and is only
*known* at T+tf.  Every consumer must respect that (see features.py).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict

import numpy as np
import pandas as pd

from .config import FOREX

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

TF_MINUTES = {"5m": 5, "15m": 15, "1h": 60, "4h": 240}


def load_5m(market: str, data_dir: str = DATA_DIR) -> pd.DataFrame:
    for ext in (".parquet", ".csv"):
        p = os.path.join(data_dir, f"{market}_5m{ext}")
        if os.path.exists(p):
            df = pd.read_parquet(p) if ext == ".parquet" else pd.read_csv(p)
            break
    else:
        raise FileNotFoundError(f"no 5m data for {market} in {data_dir}")
    df["time"] = pd.to_datetime(df["time"], utc=True)
    df = df.sort_values("time").drop_duplicates("time").set_index("time")
    return df[[c for c in ("open", "high", "low", "close", "volume", "spread") if c in df]]


def validate(df: pd.DataFrame, market: str) -> dict:
    """Basic integrity report. Raises on hard errors (look-ahead risk)."""
    idx = df.index
    if not idx.is_monotonic_increasing:
        raise ValueError(f"{market}: timestamps not sorted")
    if idx.has_duplicates:
        raise ValueError(f"{market}: duplicate timestamps")
    bad = ((df.high < df[["open", "close"]].max(axis=1)) |
           (df.low > df[["open", "close"]].min(axis=1)) | (df.high < df.low))
    step = pd.Timedelta("5min")
    gaps = idx.to_series().diff().dropna()
    big = gaps[gaps > step]
    if market in FOREX:  # weekend gaps are expected in FX
        big = big[big < pd.Timedelta("36h")]
    return {
        "market": market,
        "start": str(idx[0]), "end": str(idx[-1]), "bars": int(len(df)),
        "ohlc_inconsistent_bars": int(bad.sum()),
        "unexpected_gaps": int(len(big)),
        "largest_gap": str(big.max()) if len(big) else "none",
        "zero_range_bars_pct": float(((df.high - df.low) == 0).mean() * 100),
    }


def resample(df5: pd.DataFrame, tf: str) -> pd.DataFrame:
    if tf == "5m":
        return df5.copy()
    rule = {"15m": "15min", "1h": "1h", "4h": "4h"}[tf]
    agg = {"open": "first", "high": "max", "low": "min", "close": "last"}
    if "volume" in df5:
        agg["volume"] = "sum"
    out = df5.resample(rule, label="left", closed="left").agg(agg)
    out = out.dropna(subset=["open"])
    out.index = out.index.as_unit("ns")
    return out


@dataclass
class MarketData:
    market: str
    m5: pd.DataFrame
    m15: pd.DataFrame
    h1: pd.DataFrame
    h4: pd.DataFrame

    @classmethod
    def from_5m(cls, market: str, df5: pd.DataFrame) -> "MarketData":
        df5 = df5.copy()
        df5.index = pd.DatetimeIndex(df5.index).as_unit("ns")   # all maths in int ns
        return cls(market, df5, resample(df5, "15m"), resample(df5, "1h"), resample(df5, "4h"))


def load_market(market: str, data_dir: str = DATA_DIR) -> MarketData:
    return MarketData.from_5m(market, load_5m(market, data_dir))


# --------------------------------------------------------------------------
# Synthetic NULL data: a driftless random walk with volatility clustering,
# fat tails and intraday seasonality.  By construction there is NO exploitable
# edge, so any strategy must lose roughly its trading costs.  Used to (1) run
# the entire pipeline end to end and (2) detect look-ahead bugs: a "profitable"
# result on this data would indicate a bug, not an edge.
# --------------------------------------------------------------------------
SYNTH_SPECS: Dict[str, dict] = {
    "BTCUSDT": dict(p0=16500.0, vol=0.50, fx=False, seed=11),
    "ETHUSDT": dict(p0=1200.0, vol=0.65, fx=False, seed=12),
    "EURUSD": dict(p0=1.0700, vol=0.07, fx=True, seed=13),
    "GBPUSD": dict(p0=1.2100, vol=0.08, fx=True, seed=14),
    "USDJPY": dict(p0=131.00, vol=0.10, fx=True, seed=15),
    "XAUUSD": dict(p0=1830.0, vol=0.15, fx=True, seed=16),
}


def synthetic_5m(market: str, start="2023-01-01", end="2026-09-28") -> pd.DataFrame:
    spec = SYNTH_SPECS[market]
    rng = np.random.default_rng(spec["seed"])
    idx = pd.date_range(start, end, freq="5min", tz="UTC", inclusive="left")
    if spec["fx"]:  # FX closed Fri 21:00 -> Sun 21:00 UTC
        dow, hr = idx.dayofweek, idx.hour
        closed = (dow == 5) | ((dow == 4) & (hr >= 21)) | ((dow == 6) & (hr < 21))
        idx = idx[~closed]
    n = len(idx)
    bars_per_year = 365 * 288 if not spec["fx"] else 260 * 288
    base_sig = spec["vol"] / np.sqrt(bars_per_year)
    # intraday seasonality (UTC hour)
    hr = idx.hour.values
    if spec["fx"]:
        season = np.where(hr < 7, 0.55, np.where(hr < 12, 1.25, np.where(hr < 17, 1.45, 0.8)))
    else:
        season = np.where(hr < 7, 0.85, np.where(hr < 13, 1.0, np.where(hr < 20, 1.2, 0.95)))
    # GARCH(1,1) variance clustering on unit scale
    a, b = 0.05, 0.94
    w = 1 - a - b
    z = rng.standard_t(4, size=n) / np.sqrt(2.0)  # unit-variance t(4)
    h = np.empty(n)
    h[0] = 1.0
    for i in range(1, n):
        h[i] = w + a * (z[i - 1] ** 2) * h[i - 1] + b * h[i - 1]
    sig = base_sig * season * np.sqrt(h)
    sig = sig / np.sqrt(np.mean(season ** 2))
    # 5 sub-steps per bar -> realistic high/low
    sub = rng.standard_t(4, size=(n, 5)) / np.sqrt(2.0) * (sig[:, None] / np.sqrt(5))
    sub -= 0.5 * (sig[:, None] ** 2) / 5  # log-martingale
    path = np.cumsum(sub.ravel()).reshape(n, 5)
    start_log = np.concatenate([[0.0], path[:-1, -1]])
    logp = np.log(spec["p0"]) + np.column_stack([start_log, path])
    px = np.exp(logp)
    df = pd.DataFrame({
        "open": px[:, 0], "high": px.max(axis=1), "low": px.min(axis=1),
        "close": px[:, -1], "volume": rng.gamma(2.0, 50.0, n) * season,
    }, index=pd.DatetimeIndex(idx, name="time"))
    return df


def write_synthetic(data_dir: str, markets=tuple(SYNTH_SPECS)) -> None:
    os.makedirs(data_dir, exist_ok=True)
    for m in markets:
        synthetic_5m(m).reset_index().to_parquet(os.path.join(data_dir, f"{m}_5m.parquet"))
