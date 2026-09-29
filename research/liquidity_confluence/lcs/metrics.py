"""Performance statistics and Monte Carlo."""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats as st


def equity_curve(tr: pd.DataFrame, risk_pct: float) -> pd.Series:
    if tr is None or len(tr) == 0:
        return pd.Series(dtype=float)
    r = tr.sort_values("exit_time")
    eq = np.cumprod(1 + r.R.values * risk_pct / 100.0)
    return pd.Series(eq, index=r.exit_time.values)


def _streaks(win: np.ndarray):
    best_w = best_l = cur_w = cur_l = 0
    for w in win:
        if w:
            cur_w += 1; cur_l = 0
        else:
            cur_l += 1; cur_w = 0
        best_w = max(best_w, cur_w); best_l = max(best_l, cur_l)
    return best_w, best_l


def summarize(tr: pd.DataFrame, risk_pct: float = 0.5, start=None, end=None) -> dict:
    n = 0 if tr is None else len(tr)
    if n == 0:
        return {"trades": 0}
    tr = tr.sort_values("exit_time")
    R = tr.R.values
    win = R > 0
    wins, losses = R[win], R[~win]
    wr = win.mean()
    avg_w = wins.mean() if len(wins) else 0.0
    avg_l = -losses.mean() if len(losses) else 0.0
    expectancy = wr * avg_w - (1 - wr) * avg_l            # == R.mean()
    gp, gl = wins.sum(), -losses.sum()
    pf = gp / gl if gl > 0 else np.inf
    # equity (% account), daily series for Sharpe/Sortino
    eq = equity_curve(tr, risk_pct)
    start = pd.Timestamp(start) if start is not None else tr.entry_time.min().floor("D")
    end = pd.Timestamp(end) if end is not None else tr.exit_time.max().ceil("D")
    days = pd.date_range(start.floor("D"), end.floor("D"), freq="D", tz="UTC")
    daily_eq = eq.groupby(pd.DatetimeIndex(eq.index).floor("D")).last().reindex(days).ffill().fillna(1.0)
    dret = daily_eq.pct_change().fillna(daily_eq.iloc[0] - 1.0)
    years = max((end - start).days / 365.25, 1e-9)
    total = eq.iloc[-1] - 1
    cagr = (eq.iloc[-1]) ** (1 / years) - 1 if eq.iloc[-1] > 0 else -1.0
    sd = dret.std()
    sharpe = dret.mean() / sd * np.sqrt(365) if sd > 0 else np.nan
    dd_sd = np.sqrt(np.mean(np.minimum(dret, 0) ** 2))
    sortino = dret.mean() / dd_sd * np.sqrt(365) if dd_sd > 0 else np.nan
    peak = np.maximum.accumulate(np.concatenate([[1.0], eq.values]))
    dd = 1 - np.concatenate([[1.0], eq.values]) / peak
    max_dd = dd.max()
    # drawdown duration (calendar days peak -> recovery / end)
    times = np.concatenate([[start.value], eq.index.values.astype("datetime64[ns]").astype(np.int64)])
    longest, cur_start = 0.0, None
    for t, d in zip(times, dd):
        if d > 1e-12 and cur_start is None:
            cur_start = t
        elif d <= 1e-12 and cur_start is not None:
            longest = max(longest, (t - cur_start) / 8.64e13); cur_start = None
    if cur_start is not None:
        longest = max(longest, (end.value - cur_start) / 8.64e13)
    cumR = np.cumsum(R)
    ddR = (np.maximum.accumulate(np.concatenate([[0], cumR])) - np.concatenate([[0], cumR])).max()
    bw, bl = _streaks(win)
    tstat, p_one = (np.nan, np.nan)
    if n > 2 and R.std(ddof=1) > 0:
        tstat = R.mean() / (R.std(ddof=1) / np.sqrt(n))
        p_one = 1 - st.t.cdf(tstat, n - 1)
    rng = np.random.default_rng(0)
    boot = rng.choice(R, size=(2000, n), replace=True).mean(axis=1)
    return {
        "trades": n, "winners": int(win.sum()), "losers": int((~win).sum()),
        "win_rate": wr * 100, "avg_win_R": avg_w, "avg_loss_R": avg_l,
        "reward_risk": avg_w / avg_l if avg_l > 0 else np.nan,
        "expectancy_R": expectancy, "exp_ci95_lo": np.percentile(boot, 2.5),
        "exp_ci95_hi": np.percentile(boot, 97.5), "t_stat": tstat, "p_value": p_one,
        "profit_factor": pf, "net_R": R.sum(), "net_pct": total * 100,
        "cagr_pct": cagr * 100, "max_dd_pct": max_dd * 100, "max_dd_R": ddR,
        "max_dd_days": longest, "sharpe": sharpe, "sortino": sortino,
        "calmar": (cagr / max_dd) if max_dd > 0 else np.nan,
        "recovery_factor": (total / max_dd) if max_dd > 0 else np.nan,
        "max_consec_wins": bw, "max_consec_losses": bl,
        "avg_cost_R": tr.cost_R.mean() if "cost_R" in tr else np.nan,
    }


def monthly_table(tr: pd.DataFrame, risk_pct: float) -> pd.DataFrame:
    if tr is None or len(tr) == 0:
        return pd.DataFrame()
    t = tr.copy()
    t["month"] = t.exit_time.dt.tz_convert(None).dt.to_period("M")
    g = t.groupby("month")
    out = pd.DataFrame({
        "trades": g.size(), "net_R": g.R.sum(), "win_rate": g.R.apply(lambda x: (x > 0).mean() * 100),
        "ret_pct": g.R.apply(lambda x: (np.prod(1 + x.values * risk_pct / 100) - 1) * 100)})
    return out


def drawdown_series(eq: pd.Series) -> pd.Series:
    if len(eq) == 0:
        return eq
    return eq / eq.cummax() - 1


def monte_carlo(R: np.ndarray, risk_pct: float, n_sims: int = 10_000, seed: int = 42,
                ruin_dd: float = 0.30, ruin_equity: float = 0.50) -> dict:
    """Two schemes:
    * permutation (spec): random order of the SAME trades -> drawdown & streak
      distributions (final return is identical by construction).
    * bootstrap (with replacement) -> distribution of final return and
      probability of ruin, since permutation cannot change the end result.
    """
    R = np.asarray(R, float)
    n = len(R)
    if n < 2:
        return {}
    rng = np.random.default_rng(seed)
    f = risk_pct / 100.0

    def paths(M):
        eq = np.cumprod(1 + M * f, axis=1)
        eq = np.concatenate([np.ones((M.shape[0], 1)), eq], axis=1)
        dd = 1 - eq / np.maximum.accumulate(eq, axis=1)
        return eq, dd

    def max_loss_streak(M):
        out = np.zeros(M.shape[0], int)
        cur = np.zeros(M.shape[0], int)
        for j in range(M.shape[1]):
            cur = np.where(M[:, j] <= 0, cur + 1, 0)
            out = np.maximum(out, cur)
        return out

    perm = np.array([rng.permutation(R) for _ in range(n_sims)])
    _, ddp = paths(perm)
    maxdd_p = ddp.max(axis=1)
    streak_p = max_loss_streak(perm)
    boot = rng.choice(R, size=(n_sims, n), replace=True)
    eqb, ddb = paths(boot)
    final_b = eqb[:, -1] - 1
    maxdd_b = ddb.max(axis=1)
    q = lambda a, x: float(np.percentile(a, x))
    return {
        "n_trades": n, "n_sims": n_sims,
        "perm_maxdd_p5": q(maxdd_p, 5) * 100, "perm_maxdd_p50": q(maxdd_p, 50) * 100,
        "perm_maxdd_p95": q(maxdd_p, 95) * 100, "perm_maxdd_p99": q(maxdd_p, 99) * 100,
        "perm_streak_p50": q(streak_p, 50), "perm_streak_p95": q(streak_p, 95),
        "perm_streak_max": int(streak_p.max()),
        "boot_ret_p5": q(final_b, 5) * 100, "boot_ret_p50": q(final_b, 50) * 100,
        "boot_ret_p95": q(final_b, 95) * 100, "boot_prob_loss": float((final_b < 0).mean() * 100),
        "boot_maxdd_p50": q(maxdd_b, 50) * 100, "boot_maxdd_p95": q(maxdd_b, 95) * 100,
        f"prob_dd_ge_{int(ruin_dd*100)}pct": float((maxdd_b >= ruin_dd).mean() * 100),
        f"prob_ruin_equity_le_{int(ruin_equity*100)}pct": float((eqb.min(axis=1) <= ruin_equity).mean() * 100),
        "_perm_maxdd": maxdd_p, "_boot_final": final_b, "_perm_streak": streak_p,
    }
