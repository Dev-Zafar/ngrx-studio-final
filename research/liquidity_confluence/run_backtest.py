#!/usr/bin/env python3
"""Run the full research protocol and write results/<tag>/REPORT.md.

  python run_backtest.py                 # real data in ./data (see download_data.py)
  python run_backtest.py --synthetic     # driftless synthetic null data (engine check)
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lcs.config import MARKETS  # noqa: E402
from lcs.data import write_synthetic  # noqa: E402
from lcs.experiments import run_all  # noqa: E402
from lcs.report import write_report  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synthetic", action="store_true", help="use synthetic null data")
    ap.add_argument("--markets", nargs="*", default=list(MARKETS))
    ap.add_argument("--data-dir", default=os.path.join(HERE, "data"))
    ap.add_argument("--out", default=None)
    ap.add_argument("--mc-sims", type=int, default=10_000)
    ap.add_argument("--control-reps", type=int, default=200)
    a = ap.parse_args()
    data_dir = a.data_dir
    if a.synthetic:
        data_dir = os.path.join(HERE, "data", "synthetic")
        missing = [m for m in a.markets if not os.path.exists(os.path.join(data_dir, f"{m}_5m.parquet"))]
        if missing:
            print("writing synthetic data for", missing)
            write_synthetic(data_dir, missing)
    out = a.out or os.path.join(HERE, "results", "synthetic_null" if a.synthetic else "real")
    R = run_all(data_dir, out, a.markets, synthetic=a.synthetic, mc_sims=a.mc_sims,
                control_reps=a.control_reps)
    classes = write_report(R, out)
    print("\nreport:", os.path.join(out, "REPORT.md"))
    for m, c in classes.items():
        print(f"  {m:8s} {c[0]}")


if __name__ == "__main__":
    main()
