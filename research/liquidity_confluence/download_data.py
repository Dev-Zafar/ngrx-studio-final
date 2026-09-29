#!/usr/bin/env python3
"""Download / import 5-minute OHLCV data into ./data/<MARKET>_5m.parquet.

Sources
  Crypto : Binance USDT-M perpetual futures klines (5m) from data.binance.vision
           (monthly zips + daily zips for the current month) and the funding
           rate history (saved as <MARKET>_funding.parquet for reference).
  FX/XAU : Dukascopy 1-minute BID and ASK candles (datafeed.dukascopy.com),
           converted to mid prices, resampled to 5m, with the average
           bid/ask spread per bar kept in a `spread` column.
  Other  : --from-csv FILE --market NAME imports any CSV with columns
           time,open,high,low,close[,volume] (UTC) and resamples to 5m.

NOTE: this script could not be exercised against the live endpoints from the
environment it was written in (those hosts were blocked).  File formats follow
the documented layouts; run with --check to validate a few files first.

Examples
  python download_data.py --start 2023-01-01 --end 2026-09-28
  python download_data.py --markets EURUSD --start 2023-01-01
  python download_data.py --from-csv my_xau_m1.csv --market XAUUSD
"""
from __future__ import annotations

import argparse
import io
import lzma
import os
import struct
import sys
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
CACHE = os.path.join(DATA, "_cache")
BINANCE = "https://data.binance.vision/data/futures/um"
DUKA = "https://datafeed.dukascopy.com/datafeed"
DUKA_POINT = {"EURUSD": 1e5, "GBPUSD": 1e5, "USDJPY": 1e3, "XAUUSD": 1e3}
KLINE_COLS = ["open_time", "open", "high", "low", "close", "volume", "close_time", "quote_volume",
              "count", "taker_buy_volume", "taker_buy_quote_volume", "ignore"]


def fetch(url: str, retries: int = 4) -> bytes | None:
    """GET with on-disk cache and exponential backoff. Returns None on 404."""
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, url.split("://", 1)[1].replace("/", "_"))
    if os.path.exists(key):
        with open(key, "rb") as f:
            return f.read()
    for k in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "lcs-research/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            with open(key, "wb") as f:
                f.write(data)
            return data
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            err = e
        except Exception as e:  # noqa: BLE001
            err = e
        time.sleep(2 ** (k + 1))
    print(f"  FAILED {url}: {err}", file=sys.stderr)
    return None


# ------------------------------------------------------------------ Binance
def _read_kline_zip(blob: bytes) -> pd.DataFrame:
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        raw = z.read(z.namelist()[0]).decode()
    first = raw.split("\n", 1)[0]
    header = 0 if not first[:1].isdigit() else None
    df = pd.read_csv(io.StringIO(raw), header=header)
    df.columns = KLINE_COLS[:len(df.columns)]
    ot = df.open_time.astype("int64")
    unit = "us" if ot.iloc[0] > 10 ** 14 else "ms"            # Binance switched some files to µs
    df["time"] = pd.to_datetime(ot, unit=unit, utc=True)
    return df[["time", "open", "high", "low", "close", "volume"]]


def binance(market: str, start: date, end: date) -> pd.DataFrame:
    months = pd.period_range(start, end, freq="M")
    urls = []
    today = date.today()
    for p in months:
        if (p.year, p.month) < (today.year, today.month):
            urls.append(f"{BINANCE}/monthly/klines/{market}/5m/{market}-5m-{p.year}-{p.month:02d}.zip")
        else:  # current month: daily files
            d = date(p.year, p.month, 1)
            while d <= min(end, today - timedelta(days=1)):
                urls.append(f"{BINANCE}/daily/klines/{market}/5m/{market}-5m-{d.isoformat()}.zip")
                d += timedelta(days=1)
    with ThreadPoolExecutor(8) as ex:
        blobs = list(ex.map(fetch, urls))
    frames = [_read_kline_zip(b) for b in blobs if b]
    df = pd.concat(frames).drop_duplicates("time").sort_values("time")
    fund_urls = [f"{BINANCE}/monthly/fundingRate/{market}/{market}-fundingRate-{p.year}-{p.month:02d}.zip"
                 for p in months]
    with ThreadPoolExecutor(8) as ex:
        fblobs = list(ex.map(fetch, fund_urls))
    fr = []
    for b in fblobs:
        if b:
            with zipfile.ZipFile(io.BytesIO(b)) as z:
                fr.append(pd.read_csv(z.open(z.namelist()[0])))
    if fr:
        f = pd.concat(fr)
        f["time"] = pd.to_datetime(f.iloc[:, 0], unit="ms", utc=True)
        f.to_parquet(os.path.join(DATA, f"{market}_funding.parquet"))
    return df


# ------------------------------------------------------------------ Dukascopy
def _duka_day(market: str, d: date, side: str) -> pd.DataFrame | None:
    url = f"{DUKA}/{market}/{d.year}/{d.month - 1:02d}/{d.day:02d}/{side}_candles_min_1.bi5"
    blob = fetch(url)
    if not blob:
        return None
    raw = lzma.decompress(blob)
    n = len(raw) // 24
    if n == 0:
        return None
    rec = np.array(struct.unpack(">" + "IIIIIf" * n, raw[: n * 24])).reshape(n, 6)
    pt = DUKA_POINT[market]
    t0 = pd.Timestamp(d, tz="UTC")
    df = pd.DataFrame({
        "time": t0 + pd.to_timedelta(rec[:, 0], unit="s"),
        "open": rec[:, 1] / pt, "close": rec[:, 2] / pt, "low": rec[:, 3] / pt, "high": rec[:, 4] / pt,
        "volume": rec[:, 5]})
    return df[df.volume > 0]            # Dukascopy pads closed minutes with zero-volume flat candles


def dukascopy(market: str, start: date, end: date) -> pd.DataFrame:
    days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
    days = [d for d in days if d.weekday() != 5]                     # Saturday closed
    out = []
    with ThreadPoolExecutor(8) as ex:
        bids = list(ex.map(lambda d: _duka_day(market, d, "BID"), days))
        asks = list(ex.map(lambda d: _duka_day(market, d, "ASK"), days))
    for b, a in zip(bids, asks):
        if b is None or a is None:
            continue
        m = b.merge(a, on="time", suffixes=("_b", "_a"))
        out.append(pd.DataFrame({
            "time": m.time,
            "open": (m.open_b + m.open_a) / 2, "high": (m.high_b + m.high_a) / 2,
            "low": (m.low_b + m.low_a) / 2, "close": (m.close_b + m.close_a) / 2,
            "volume": m.volume_b, "spread": m.close_a - m.close_b}))
    return pd.concat(out).sort_values("time")


# ------------------------------------------------------------------ common
def to_5m(df: pd.DataFrame) -> pd.DataFrame:
    df = df.set_index("time").sort_index()
    agg = {"open": "first", "high": "max", "low": "min", "close": "last"}
    if "volume" in df:
        agg["volume"] = "sum"
    if "spread" in df:
        agg["spread"] = "mean"
    out = df.resample("5min", label="left", closed="left").agg(agg).dropna(subset=["open"])
    return out.reset_index()


def save(market: str, df5: pd.DataFrame):
    os.makedirs(DATA, exist_ok=True)
    p = os.path.join(DATA, f"{market}_5m.parquet")
    df5.to_parquet(p, index=False)
    print(f"  {market}: {len(df5):,} bars {df5.time.iloc[0]} -> {df5.time.iloc[-1]}  -> {p}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--markets", nargs="*", default=["BTCUSDT", "ETHUSDT", "EURUSD", "GBPUSD", "USDJPY", "XAUUSD"])
    ap.add_argument("--start", default="2023-01-01")
    ap.add_argument("--end", default=str(date.today() - timedelta(days=1)))
    ap.add_argument("--from-csv")
    ap.add_argument("--market")
    ap.add_argument("--check", action="store_true", help="download 3 days only to validate formats")
    a = ap.parse_args()
    if a.from_csv:
        df = pd.read_csv(a.from_csv)
        df["time"] = pd.to_datetime(df["time"], utc=True)
        save(a.market, to_5m(df))
        return
    s, e = date.fromisoformat(a.start), date.fromisoformat(a.end)
    if a.check:
        e = s + timedelta(days=3)
    for m in a.markets:
        print(f"downloading {m} {s} -> {e}")
        if m.endswith("USDT"):
            df = binance(m, s, e)
            df = df[(df.time >= pd.Timestamp(s, tz="UTC")) & (df.time < pd.Timestamp(e + timedelta(days=1), tz="UTC"))]
            save(m, df.reset_index(drop=True))
        else:
            save(m, to_5m(dukascopy(m, s, e)))


if __name__ == "__main__":
    main()
