"""High-impact scheduled-event calendar and blackout windows.

Built-in coverage (no network needed):
  * FOMC rate decisions 2023-2026 (hard-coded, 14:00 US/Eastern).
  * US Non-Farm Payrolls, APPROXIMATED as the first Friday of each month at
    08:30 US/Eastern.  Real release dates occasionally deviate (e.g. the
    Oct-Nov 2025 US government shutdown delays) - replace with a verified file.

Everything else (CPI, ECB, BoE, BoJ, other rate decisions) MUST be supplied in
data/news_events.csv with columns: time_utc,currency,event
If that file is absent those events are NOT filtered, and the report says so.
"""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone

import numpy as np
import pandas as pd

FOMC_DATES = [
    "2023-02-01", "2023-03-22", "2023-05-03", "2023-06-14", "2023-07-26", "2023-09-20",
    "2023-11-01", "2023-12-13",
    "2024-01-31", "2024-03-20", "2024-05-01", "2024-06-12", "2024-07-31", "2024-09-18",
    "2024-11-07", "2024-12-18",
    "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18", "2025-07-30", "2025-09-17",
    "2025-10-29", "2025-12-10",
    "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16",
    "2026-10-28", "2026-12-09",
]

CCY_MARKETS = {
    "USD": ("EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSDT", "ETHUSDT"),
    "EUR": ("EURUSD",),
    "GBP": ("GBPUSD",),
    "JPY": ("USDJPY",),
}


def _us_dst(d: date) -> bool:
    """US DST: second Sunday of March 02:00 -> first Sunday of November."""
    mar = date(d.year, 3, 8)
    start = mar + timedelta(days=(6 - mar.weekday()) % 7)
    nov = date(d.year, 11, 1)
    end = nov + timedelta(days=(6 - nov.weekday()) % 7)
    return start <= d < end


def _et_to_utc(d: date, hh: int, mm: int) -> datetime:
    off = 4 if _us_dst(d) else 5
    return datetime(d.year, d.month, d.day, hh, mm, tzinfo=timezone.utc) + timedelta(hours=off)


def builtin_events(start="2023-01-01", end="2026-12-31") -> pd.DataFrame:
    rows = []
    for s in FOMC_DATES:
        d = date.fromisoformat(s)
        rows.append((_et_to_utc(d, 14, 0), "USD", "FOMC"))
    for p in pd.period_range(start, end, freq="M"):
        d = date(p.year, p.month, 1)
        d = d + timedelta(days=(4 - d.weekday()) % 7)
        rows.append((_et_to_utc(d, 8, 30), "USD", "NFP (approx: first Friday)"))
    return pd.DataFrame(rows, columns=["time_utc", "currency", "event"])


def load_events(data_dir: str) -> tuple[pd.DataFrame, str]:
    ev = builtin_events()
    src = "built-in FOMC (exact) + NFP (first-Friday approximation)"
    path = os.path.join(data_dir, "news_events.csv")
    if os.path.exists(path):
        user = pd.read_csv(path)
        user["time_utc"] = pd.to_datetime(user["time_utc"], utc=True)
        ev = pd.concat([ev[ev.event == "FOMC"], user], ignore_index=True)
        src = f"FOMC (built-in) + {len(user)} events from news_events.csv"
    ev["time_utc"] = pd.to_datetime(ev["time_utc"], utc=True)
    return ev.sort_values("time_utc").reset_index(drop=True), src


def blackout_intervals(events: pd.DataFrame, market: str, before_min=30, after_min=60):
    """Merged [start, end) blackout intervals (ns) for a market."""
    rel = events[events.currency.map(lambda c: market in CCY_MARKETS.get(c, ()))]
    if rel.empty:
        return np.array([], np.int64), np.array([], np.int64)
    t = rel.time_utc.values.astype("datetime64[ns]").astype(np.int64)
    s = np.sort(t - before_min * 60_000_000_000)
    e = np.sort(t + after_min * 60_000_000_000)
    ms, me = [s[0]], [e[0]]
    for a, b in zip(s[1:], e[1:]):
        if a <= me[-1]:
            me[-1] = max(me[-1], b)
        else:
            ms.append(a); me.append(b)
    return np.asarray(ms, np.int64), np.asarray(me, np.int64)


def in_blackout(t_ns: np.ndarray, starts: np.ndarray, ends: np.ndarray) -> np.ndarray:
    if len(starts) == 0:
        return np.zeros(len(t_ns), bool)
    k = np.searchsorted(starts, t_ns, side="right") - 1
    return (k >= 0) & (t_ns < ends[np.clip(k, 0, None)])
