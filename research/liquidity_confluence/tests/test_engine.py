"""Hand-built bar sequences checking the execution conventions."""
import os
import sys

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lcs.config import CostModel, Params  # noqa: E402
from lcs.engine import Bars, simulate  # noqa: E402

NS5 = 5 * 60_000_000_000
T0 = pd.Timestamp("2024-01-02 09:00", tz="UTC").value
ZERO = CostModel(0, 0, 0, 0, 0)


def bars(rows):
    a = np.array(rows, float)
    t = T0 + np.arange(len(a), dtype=np.int64) * NS5
    return Bars(t, a[:, 0], a[:, 1], a[:, 2], a[:, 3])


def cand(**kw):
    d = dict(t_dec=T0, t_deadline=T0 + 100 * NS5, dir=1, entry=100.0, sl=99.0, risk=1.0,
             tp1=103.0, tp2=103.0, tp3=105.0, impulse_end=110.0, atr=1.0)
    d.update(kw)
    return pd.DataFrame([d])


P = Params(exit_mode="rr2.0", entry_mode="limit", max_hold_hours=48)


def test_limit_fill_then_target():
    b = bars([[100.5, 100.6, 99.9, 100.2],   # fills at 100
              [100.2, 101.0, 100.1, 100.9],
              [100.9, 102.1, 100.8, 102.0]])  # TP 102 hit
    tr = simulate(cand(), b, P, ZERO)
    assert len(tr) == 1 and tr.exit_reason[0] == "tp"
    assert tr.R[0] == pytest.approx(2.0)


def test_no_target_on_fill_bar_and_stop_first():
    b = bars([[100.5, 102.5, 99.95, 100.0],  # fill bar reaches TP -> ignored
              [100.0, 102.5, 98.9, 100.0]])  # stop and target same bar -> stop
    tr = simulate(cand(), b, P, ZERO)
    assert tr.exit_reason[0] == "sl" and tr.R[0] == pytest.approx(-1.0)


def test_spread_blocks_marginal_fill():
    cost = CostModel(half_spread=0.05, slippage=0.0, maker_fee=0, taker_fee=0)
    b = bars([[100.5, 100.6, 99.97, 100.2]] * 5)   # low never reaches 100 - 0.05
    assert len(simulate(cand(), b, P, cost)) == 0


def test_cancel_when_impulse_exceeded_first():
    b = bars([[100.5, 110.5, 100.4, 110.2],  # breaks impulse high (110) before any fill
              [110.0, 110.1, 99.0, 99.5]])
    assert len(simulate(cand(), b, P, ZERO)) == 0


def test_costs_and_gap_stop():
    cost = CostModel(half_spread=0.0, slippage=0.1, maker_fee=0.001, taker_fee=0.002)
    b = bars([[100.5, 100.6, 99.9, 100.2],
              [98.0, 98.2, 97.5, 97.8]])   # gaps below the stop: fills at open - slippage
    tr = simulate(cand(), b, P, cost)
    exit_px = 98.0 - 0.1
    expect = (exit_px - 100.0 - 0.001 * 100.0 - 0.002 * exit_px) / 1.0
    assert tr.R[0] == pytest.approx(expect)


def test_short_mirror():
    b = bars([[99.5, 100.1, 99.4, 99.8],
              [99.8, 99.9, 99.0, 99.1],
              [99.1, 99.2, 97.9, 98.0]])
    c = cand(dir=-1, entry=100.0, sl=101.0, tp1=97.0, tp2=97.0, tp3=95.0, impulse_end=90.0)
    tr = simulate(c, b, P, ZERO)
    assert tr.exit_reason[0] == "tp" and tr.R[0] == pytest.approx(2.0)


def test_daily_loss_limit_blocks_third_trade():
    rows = []
    for _ in range(3):
        rows += [[100.5, 100.6, 99.9, 100.2], [100.0, 100.1, 98.5, 98.6]]   # fill, stop
    b = bars(rows)
    cs = pd.concat([cand(t_dec=T0 + 2 * k * NS5, t_deadline=T0 + (2 * k + 1) * NS5) for k in range(3)],
                   ignore_index=True)
    tr = simulate(cs, b, P, ZERO)
    assert len(tr) == 2 and tr.R.sum() == pytest.approx(-2.0)
