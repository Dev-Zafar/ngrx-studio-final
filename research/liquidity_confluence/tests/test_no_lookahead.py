"""Look-ahead bias tests.

If any signal or trade depended on data after its decision time, computing it
on a truncated history would give a different answer than on the full history.
"""
import os
import sys

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lcs.config import Params, cost_for  # noqa: E402
from lcs.data import MarketData, synthetic_5m  # noqa: E402
from lcs.engine import Bars, prepare, simulate  # noqa: E402
from lcs.signals import generate_candidates  # noqa: E402

CUTS = ["2023-05-17 13:45", "2023-07-03 09:00", "2023-08-22 20:15"]


@pytest.fixture(scope="module", params=["BTCUSDT", "GBPUSD"])
def full(request):
    m = request.param
    df = synthetic_5m(m, start="2023-01-01", end="2023-10-01")
    md = MarketData.from_5m(m, df)
    p = Params(min_score=6)
    return m, df, md, p, generate_candidates(md, p)


def _cmp_cols(c):
    return c.drop(columns=["t_exp", "i"], errors="ignore").reset_index(drop=True)


@pytest.mark.parametrize("cut", CUTS)
def test_candidates_identical_before_cut(full, cut):
    m, df, md, p, cf = full
    T = pd.Timestamp(cut, tz="UTC")
    mdt = MarketData.from_5m(m, df[df.index < T])
    ct = generate_candidates(mdt, p)
    tn = T.value
    a = _cmp_cols(cf[cf.t_dec <= tn])
    b = _cmp_cols(ct[ct.t_dec <= tn])
    assert len(a) > 0
    pd.testing.assert_frame_equal(a, b, check_exact=False, rtol=1e-12)


@pytest.mark.parametrize("cut", CUTS)
@pytest.mark.parametrize("entry_mode,exit_mode", [("limit", "rr2.0"), ("confirm", "partial"),
                                                  ("limit", "trail")])
def test_trades_identical_before_cut(full, cut, entry_mode, exit_mode):
    m, df, md, p, cf = full
    p = p.with_(entry_mode=entry_mode, exit_mode=exit_mode)
    cost = cost_for(m)
    T = pd.Timestamp(cut, tz="UTC")
    tf = simulate(prepare(cf, p, cost), Bars.from_df(md.m5), p, cost)
    mdt = MarketData.from_5m(m, df[df.index < T])
    ct = generate_candidates(mdt, p)
    tt = simulate(prepare(ct, p, cost), Bars.from_df(mdt.m5), p, cost)
    lim = T - pd.Timedelta(hours=1)
    cols = ["dir", "entry_time", "exit_time", "entry", "sl", "exit", "R"]
    a = tf[tf.exit_time < lim][cols].reset_index(drop=True)
    b = tt[tt.exit_time < lim][cols].reset_index(drop=True) if len(tt) else a.iloc[:0]
    pd.testing.assert_frame_equal(a, b, check_exact=False, rtol=1e-12)


def test_short_is_mirror_of_long():
    """Negating prices must turn every long into a short with identical R."""
    df = synthetic_5m("EURUSD", start="2023-01-01", end="2023-07-01")
    neg = df.copy()
    neg["open"], neg["close"] = 10 - df.open, 10 - df.close
    neg["high"], neg["low"] = 10 - df.low, 10 - df.high
    p = Params(min_score=6)
    zero = cost_for("EURUSD", "zero")
    ca = generate_candidates(MarketData.from_5m("EURUSD", df), p)
    cb = generate_candidates(MarketData.from_5m("EURUSD", neg), p)
    assert len(ca) == len(cb) > 0
    assert (ca.dir.values == -cb.dir.values).all()
    np.testing.assert_allclose(ca.entry.values, 10 - cb.entry.values, rtol=1e-9)
    ta = simulate(prepare(ca, p, zero), Bars.from_df(MarketData.from_5m("EURUSD", df).m5), p, zero)
    tb = simulate(prepare(cb, p, zero), Bars.from_df(MarketData.from_5m("EURUSD", neg).m5), p, zero)
    np.testing.assert_allclose(ta.R.values, tb.R.values, rtol=1e-6, atol=1e-9)
