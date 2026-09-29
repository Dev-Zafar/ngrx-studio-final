"""Markdown report + charts + CSV exports."""
from __future__ import annotations

import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from .config import COST_SCENARIOS, REALISTIC_COSTS  # noqa: E402
from .metrics import equity_curve, drawdown_series, monthly_table  # noqa: E402

INK, MUTED, GRID = "#1f2937", "#6b7280", "#e5e7eb"
SERIES = ["#2563eb", "#d97706", "#059669", "#dc2626", "#7c3aed", "#0891b2"]


# ----------------------------------------------------------------- helpers
def _fmt(x, nd=2):
    if x is None:
        return "–"
    if isinstance(x, (bool, np.bool_)):
        return "yes" if x else "no"
    if isinstance(x, (int, np.integer)):
        return f"{x:d}"
    if isinstance(x, (float, np.floating)):
        if np.isnan(x):
            return "–"
        if np.isinf(x):
            return "∞"
        return f"{x:.{nd}f}"
    return str(x)


def md_table(df: pd.DataFrame, nd=2) -> str:
    if df is None or len(df) == 0:
        return "_no data_\n"
    cols = list(df.columns)
    out = ["| " + " | ".join(str(c) for c in cols) + " |", "|" + "---|" * len(cols)]
    for _, r in df.iterrows():
        out.append("| " + " | ".join(_fmt(r[c], nd) for c in cols) + " |")
    return "\n".join(out) + "\n"


STAT_ROWS = [("trades", "Total trades"), ("winners", "Winners"), ("losers", "Losers"),
             ("win_rate", "Win rate %"), ("avg_win_R", "Average win (R)"), ("avg_loss_R", "Average loss (R)"),
             ("reward_risk", "Reward/risk"), ("expectancy_R", "Expectancy (R/trade)"),
             ("exp_ci95_lo", "Expectancy 95% CI low"), ("exp_ci95_hi", "Expectancy 95% CI high"),
             ("p_value", "p-value (mean R > 0)"), ("profit_factor", "Profit factor"), ("net_R", "Net R"),
             ("net_pct", "Net return % (0.5% risk)"), ("cagr_pct", "CAGR %"), ("max_dd_pct", "Max drawdown %"),
             ("max_dd_R", "Max drawdown (R)"), ("max_dd_days", "Max DD duration (days)"),
             ("sharpe", "Sharpe (daily, √365)"), ("sortino", "Sortino"), ("calmar", "Calmar"),
             ("recovery_factor", "Recovery factor"), ("max_consec_losses", "Max consecutive losses"),
             ("max_consec_wins", "Max consecutive wins"), ("avg_cost_R", "Avg cost per trade (R)")]


def stats_table(perf, keys, labels):
    rows = []
    for k, lab in STAT_ROWS:
        row = {"metric": lab}
        for key, name in zip(keys, labels):
            row[name] = perf.get(key, {}).get(k)
        rows.append(row)
    return pd.DataFrame(rows)


def ctrl_rank(ctrl_entry):
    """Percentile of the strategy's expectancy inside each control distribution."""
    out = {}
    for kind, d in ctrl_entry["controls"].items():
        e = d["exp"]
        out[kind] = dict(pct=(e < ctrl_entry["strategy_exp"]).mean() * 100 if len(e) else np.nan,
                         ctrl_median=np.median(e) if len(e) else np.nan,
                         ctrl_p95=np.percentile(e, 95) if len(e) else np.nan,
                         ctrl_trades=np.median(d["n"]) if len(d["n"]) else np.nan)
    return out


def classify(test, plus25, plus50, wf_pos, ctrl_min_pct, mc_p5, fragile):
    """Pre-declared evidence rules (see STRATEGY_SPEC.md §24)."""
    n, e, pv = test.get("trades", 0), test.get("expectancy_R"), test.get("p_value")
    if not n or e is None or np.isnan(e) or e <= 0:
        return "No evidence"
    if ctrl_min_pct is not None and not np.isnan(ctrl_min_pct) and ctrl_min_pct < 75:
        return "No evidence"
    pv = 1.0 if pv is None or np.isnan(pv) else pv
    p25 = plus25.get("expectancy_R") or -1
    p50 = plus50.get("expectancy_R") or -1
    if (n >= 100 and pv < 0.01 and wf_pos >= 0.7 and ctrl_min_pct >= 95 and p50 > 0
            and mc_p5 is not None and mc_p5 > 0 and not fragile):
        return "Strong evidence of edge"
    if n >= 50 and pv < 0.05 and wf_pos >= 0.6 and ctrl_min_pct >= 90 and p25 > 0 and not fragile:
        return "Moderate evidence"
    return "Weak evidence"


# ------------------------------------------------------------------ charts
def _style(ax):
    ax.grid(True, color=GRID, lw=0.6)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.tick_params(colors=MUTED, labelsize=8)


def charts(R, out_dir):
    lab = R["lab"]
    markets = R["markets"]
    rp = R["final_params"]["risk_pct"]
    bounds = [pd.Timestamp(lab.splits["validation"].t0, tz="UTC"), pd.Timestamp(lab.splits["test"].t0, tz="UTC")]
    fig, axes = plt.subplots(len(markets), 2, figsize=(12, 2.3 * len(markets)), squeeze=False)
    for i, m in enumerate(markets):
        t = R["trades_store"][(m, "full")]
        ax, ax2 = axes[i]
        if len(t):
            eq = equity_curve(t, rp)
            ax.plot(eq.index, (eq.values - 1) * 100, color=SERIES[0], lw=1.2)
            dd = drawdown_series(eq)
            ax2.fill_between(dd.index, dd.values * 100, 0, color=SERIES[3], alpha=0.35, lw=0)
        for a in (ax, ax2):
            for b in bounds:
                a.axvline(b, color=MUTED, ls="--", lw=0.8)
            _style(a)
        ax.set_title(f"{m} — equity, % return (0.5% risk)", fontsize=9, color=INK, loc="left")
        ax2.set_title(f"{m} — drawdown %", fontsize=9, color=INK, loc="left")
    fig.text(0.5, 0.005, "dashed lines: train | validation | test boundaries", ha="center", color=MUTED, fontsize=8)
    fig.tight_layout(rect=(0, 0.015, 1, 1))
    fig.savefig(os.path.join(out_dir, "equity_drawdown.png"), dpi=110)
    plt.close(fig)

    for split in ("test", "full"):
        mc = R["mc"].get(("POOLED", split))
        if not mc:
            continue
        fig, ax = plt.subplots(1, 3, figsize=(13, 3.2))
        ax[0].hist(mc["_boot_final"] * 100, bins=60, color=SERIES[0], alpha=0.85)
        ax[0].axvline(0, color=INK, lw=0.8)
        ax[0].set_title("Bootstrap final return % (10k)", fontsize=9, loc="left")
        ax[1].hist(mc["_perm_maxdd"] * 100, bins=60, color=SERIES[3], alpha=0.85)
        ax[1].set_title("Permutation max drawdown % (10k)", fontsize=9, loc="left")
        ax[2].hist(mc["_perm_streak"], bins=range(0, int(mc["_perm_streak"].max()) + 2), color=SERIES[1], alpha=0.85)
        ax[2].set_title("Permutation max losing streak", fontsize=9, loc="left")
        for a in ax:
            _style(a)
        fig.suptitle(f"Monte Carlo — pooled {split} trades", fontsize=10, color=INK, x=0.01, ha="left")
        fig.tight_layout()
        fig.savefig(os.path.join(out_dir, f"monte_carlo_{split}.png"), dpi=110)
        plt.close(fig)


# ------------------------------------------------------------------ report
def write_report(R, out_dir):
    charts(R, out_dir)
    lab = R["lab"]
    markets = R["markets"]
    perf = R["perf"]
    rp = R["final_params"]["risk_pct"]
    L = []
    w = L.append
    title = "Liquidity + Structure + Displacement + OB + FVG + Fib Confluence — Backtest Report"
    w(f"# {title}\n")
    if R["synthetic"]:
        w("> **⚠ SYNTHETIC NULL DATA — NOT MARKET RESULTS.** Every number below comes from a driftless "
          "random walk (GARCH volatility clustering, t(4) fat tails, intraday seasonality, FX weekend gaps) "
          "generated by `lcs/data.py`. By construction it contains **no exploitable edge**. This run exists "
          "to (1) exercise the entire pipeline end-to-end and (2) confirm the engine does not manufacture "
          "profits from look-ahead. **It says nothing about BTCUSDT, ETHUSDT, EURUSD, GBPUSD, USDJPY or "
          "XAUUSD.** Real data could not be downloaded from this environment (network policy blocks "
          "data.binance.vision and datafeed.dukascopy.com). Run `python run_backtest.py` after "
          "`python download_data.py` to produce the real report.\n")
    w(f"Generated in {R['runtime_min']:.1f} min. Splits: " +
      ", ".join(f"**{k}** {v}" for k, v in R["splits"].items()) + "\n")
    w(f"News calendar: {R['events_src']}.\n")

    # --------------------------------------------------- classification data
    wf = R["walkforward"]
    wf_pos = float((wf.net_R > 0).mean()) if len(wf) else 0.0
    sens = R["sensitivity"]
    base_full = sens.loc[sens.variant == "selected", "full_exp"].iloc[0] if len(sens) else np.nan
    fragile = bool(len(sens) and (np.sign(sens.full_exp.dropna()) != np.sign(base_full)).any())
    ctrl_ranks = {k: ctrl_rank(v) for k, v in R["controls"].items()}

    def mkt_class(m):
        key = m
        test = perf.get((key, "test", "realistic"), {})
        p25 = perf.get((key, "test", "plus25"), {})
        p50 = perf.get((key, "test", "plus50"), {})
        if m == "POOLED":
            wpos = wf_pos
            ranks = [min(v["pct"] for v in ctrl_ranks[(x, "test")].values())
                     for x in markets if (x, "test") in ctrl_ranks]
            cmin = float(np.nanmin(ranks)) if ranks else np.nan
        else:
            wpos = float((wf[m] > 0).mean()) if len(wf) else 0.0
            cr = ctrl_ranks.get((m, "test"))
            cmin = min(v["pct"] for v in cr.values()) if cr else np.nan
        mc = R["mc"].get((key, "test"), {})
        return classify(test, p25, p50, wpos, cmin, mc.get("boot_ret_p5"), fragile), wpos, cmin

    classes = {m: mkt_class(m) for m in markets + ["POOLED"]}

    # --------------------------------------------------- executive summary
    w("## 1. Executive summary\n")
    pt, pte = perf[("POOLED", "train", "realistic")], perf[("POOLED", "test", "realistic")]
    verdict = "profitable" if (pte.get("expectancy_R") or -1) > 0 else "unprofitable"
    w(f"* Final configuration (chosen on training data, confirmed on validation): `{R['final_label']}`\n")
    w(f"* **Out-of-sample (test) result, realistic costs: {verdict}** — "
      f"{pte.get('trades', 0)} trades, expectancy {_fmt(pte.get('expectancy_R'), 3)} R, "
      f"PF {_fmt(pte.get('profit_factor'))}, win rate {_fmt(pte.get('win_rate'), 1)}%, "
      f"net {_fmt(pte.get('net_R'), 1)} R, max DD {_fmt(pte.get('max_dd_pct'))}%, "
      f"p-value {_fmt(pte.get('p_value'), 3)}.\n")
    w(f"* In-sample (train): {pt.get('trades', 0)} trades, expectancy {_fmt(pt.get('expectancy_R'), 3)} R, "
      f"PF {_fmt(pt.get('profit_factor'))}.\n")
    pz, pa = perf[("POOLED", "test", "zero")], perf[("POOLED", "test", "adverse")]
    w(f"* Cost sensitivity (test): zero-cost {_fmt(pz.get('expectancy_R'), 3)} R → realistic "
      f"{_fmt(pte.get('expectancy_R'), 3)} R → adverse {_fmt(pa.get('expectancy_R'), 3)} R per trade.\n")
    w(f"* Walk-forward: {len(wf)} out-of-sample windows, {wf_pos*100:.0f}% with positive net R; "
      f"concatenated WF expectancy {_fmt(R['wf_concat'].get('expectancy_R'), 3)} R over "
      f"{R['wf_concat'].get('trades', 0)} trades.\n")
    w(f"* Parameter sensitivity: {'FRAGILE (sign of full-sample expectancy flips under a one-step perturbation)' if fragile else 'no sign flip under one-step perturbations'}.\n")
    w(f"* **Final classification (pooled): {classes['POOLED'][0]}**" +
      (" — on synthetic null data this is the expected answer and validates the engine, it is NOT a "
       "verdict on the real markets." if R["synthetic"] else "") + "\n")

    # --------------------------------------------------- strategy rules
    fp = R["final_params"]
    w("\n## 2. Final mechanical rules (frozen)\n")
    w("Full specification: `STRATEGY_SPEC.md`. Tuned values (training data only):\n")
    w(md_table(pd.DataFrame([dict(parameter=k, value=fp[k]) for k in (
        "disp_body", "disp_atr", "disp_close_pct", "sl_buffer_atr", "min_score", "entry_mode", "exit_mode",
        "session", "model", "swing_n_15m", "swing_n_1h", "swing_n_4h", "fib_lo", "fib_hi", "min_rr_to_tp2",
        "max_cost_r", "daily_loss_limit_r", "risk_pct")])))

    w("\n### Parameter selection audit trail\n")
    w("Stage 1 (train, top 10 of 36):\n\n" + md_table(pd.DataFrame(R["stage1"][:10]), 3))
    w("\nStage 2 (train, top 10 of 64):\n\n" + md_table(pd.DataFrame(R["stage2"][:10]), 3))
    w("\nValidation check of the 5 best training configs (the first row was frozen):\n\n" +
      md_table(pd.DataFrame(R["validation_pick"]), 3))

    # --------------------------------------------------- data quality
    w("\n## 3. Data\n")
    w(md_table(pd.DataFrame(R["quality"].values())))

    # --------------------------------------------------- per market
    w("\n## 4. Performance by market (realistic costs)\n")
    w("Train and validation are in-sample for selection purposes; **test is the only untouched period**.\n")
    for m in markets + ["POOLED"]:
        w(f"\n### {m}\n")
        keys = [(m, s, "realistic") for s in ("train", "validation", "test", "full")]
        w(md_table(stats_table(perf, keys, ["train", "validation", "TEST (OOS)", "full"]), 3))

    w("\n### Market comparison (test split, realistic costs)\n")
    rows = []
    for m in markets + ["POOLED"]:
        s = perf[(m, "test", "realistic")]
        rows.append(dict(market=m, trades=s.get("trades"), win_rate=s.get("win_rate"),
                         expectancy_R=s.get("expectancy_R"), profit_factor=s.get("profit_factor"),
                         net_R=s.get("net_R"), max_dd_pct=s.get("max_dd_pct"), p_value=s.get("p_value"),
                         classification=classes[m][0]))
    w(md_table(pd.DataFrame(rows), 3))

    w("\n### Risk per trade (pooled, realistic costs)\n")
    rows = []
    for (rpct, split), s in R["risk_levels"].items():
        rows.append(dict(risk_pct=rpct, split=split, net_pct=s.get("net_pct"), cagr_pct=s.get("cagr_pct"),
                         max_dd_pct=s.get("max_dd_pct"), sharpe=s.get("sharpe")))
    w(md_table(pd.DataFrame(rows)))
    w("\n_Pooled equity compounds all markets' trades sequentially by exit time (a simplification;"
      " positions in different markets can overlap in reality)._\n")

    w("\n### Monthly performance (full sample, realistic costs, net R per market)\n")
    mt = {}
    for m in markets:
        t = R["trades_store"][(m, "full")]
        if len(t):
            mt[m] = monthly_table(t, rp).net_R
    if mt:
        mdf = pd.DataFrame(mt).fillna(0.0)
        mdf["ALL"] = mdf.sum(axis=1)
        mdf.index = mdf.index.astype(str)
        w(md_table(mdf.reset_index().rename(columns={"index": "month"})))
        mdf.to_csv(os.path.join(out_dir, "monthly_net_R.csv"))

    w("\n![equity and drawdown](equity_drawdown.png)\n")

    # --------------------------------------------------- comparisons
    def cmp_section(title, key, note=""):
        w(f"\n## {title}\n")
        if note:
            w(note + "\n")
        w(md_table(R[key], 3))

    cmp_section("5. Session analysis", "sessions",
                "Pooled stats plus per-market expectancy (R). London 08-12 UTC, NY 13-17 UTC.")
    cmp_section("6. RR / exit analysis", "rr", "Fixed RR exits vs liquidity exits (TP2, partial TP1→BE→TP3, trail after 1R).")
    cmp_section("7. Entry model (limit vs 5m confirmation)", "entry")
    cmp_section("8. Setup model (sweep-reversal vs break-continuation)", "model")

    w("\n## 9. Confluence analysis\n")
    w("Trades taken with the final configuration but **min score = 0** (mandatory conditions only), "
      "split by whether each factor was present. `exp` = mean net R.\n\n")
    w(md_table(R["confluence_factors"], 3))
    w("\nBy total score:\n\n" + md_table(R["confluence_scores"], 3))
    w("\nMinimum-score thresholds (final config otherwise):\n\n" + md_table(R["score_thresholds"], 3))

    w("\n## 10. Ablation study\n")
    w("One component removed at a time from the frozen strategy (score threshold reduced by the points the"
      " removed component could contribute). Per-market columns = expectancy (R).\n\n")
    w(md_table(R["ablation"], 3))

    w("\n## 11. Random control strategies\n")
    w("200 random replications per control. `pct` = percentile of the strategy's expectancy within the "
      "control distribution (≥95 would be needed to call the edge material).\n\n")
    rows = []
    for (m, split), cr in ctrl_ranks.items():
        for kind, d in cr.items():
            rows.append(dict(market=m, split=split, control=kind,
                             strategy_exp=R["controls"][(m, split)]["strategy_exp"],
                             strategy_n=R["controls"][(m, split)]["strategy_n"],
                             control_median_exp=d["ctrl_median"], control_p95_exp=d["ctrl_p95"],
                             control_median_trades=d["ctrl_trades"], pct=d["pct"]))
    w(md_table(pd.DataFrame(rows), 3))

    w("\n## 12. Drawdown analysis\n")
    rows = []
    for m in markets:
        s = perf[(m, "full", "realistic")]
        t = R["trades_store"][(m, "full")]
        worst = ""
        if len(t):
            eq = equity_curve(t, rp)
            dd = drawdown_series(eq)
            worst = str(pd.Timestamp(dd.idxmin()).date()) if len(dd) else ""
        rows.append(dict(market=m, max_dd_pct=s.get("max_dd_pct"), max_dd_R=s.get("max_dd_R"),
                         max_dd_days=s.get("max_dd_days"), trough_date=worst,
                         max_consec_losses=s.get("max_consec_losses")))
    w(md_table(pd.DataFrame(rows)))
    if mt:
        w("\nWorst 5 months (all markets, net R):\n\n")
        w(md_table(mdf.sort_values("ALL").head(5).reset_index().rename(columns={"index": "month"})))

    w("\n## 13. Monte Carlo (10,000 simulations)\n")
    w("Permutation = trade order shuffled (drawdown/streak risk; final return unchanged by construction). "
      "Bootstrap = trades resampled with replacement (return uncertainty and ruin).\n\n")
    rows = []
    for (m, split), mc in R["mc"].items():
        rows.append({"market": m, "split": split, **{k: v for k, v in mc.items() if not k.startswith("_")}})
    w(md_table(pd.DataFrame(rows)))
    w("\n![MC test](monte_carlo_test.png)\n\n![MC full](monte_carlo_full.png)\n")

    w("\n## 14. OUT-OF-SAMPLE RESULTS (clearly separated)\n")
    w(f"Test period {R['splits']['test']}. Parameters were frozen before this period was evaluated.\n\n")
    rows = []
    for m in markets + ["POOLED"]:
        for sc in COST_SCENARIOS:
            s = perf[(m, "test", sc)]
            rows.append(dict(market=m, costs=sc, trades=s.get("trades"), win_rate=s.get("win_rate"),
                             expectancy_R=s.get("expectancy_R"), profit_factor=s.get("profit_factor"),
                             net_R=s.get("net_R"), max_dd_pct=s.get("max_dd_pct"), p_value=s.get("p_value")))
    w(md_table(pd.DataFrame(rows), 3))
    w("\n### Walk-forward (re-selected every window on its own train/validation data)\n\n")
    w(md_table(R["walkforward"], 3))

    w("\n## 15. Robustness\n")
    w("Cost stress (pooled, full sample):\n\n")
    rows = []
    for sc in COST_SCENARIOS:
        s = perf[("POOLED", "full", sc)]
        rows.append(dict(scenario=sc, **{k: s.get(k) for k in ("trades", "expectancy_R", "profit_factor",
                                                               "net_R", "max_dd_pct")}))
    w(md_table(pd.DataFrame(rows), 3))
    w("\nScenarios: " + "; ".join(f"`{k}` {v}" for k, v in COST_SCENARIOS.items()) + "\n")
    w("\nRealistic cost model per market:\n\n")
    w(md_table(pd.DataFrame([dict(market=k, **v.__dict__) for k, v in REALISTIC_COSTS.items()]), 6))
    w("\nParameter sensitivity (pooled expectancy in R):\n\n")
    w(md_table(R["sensitivity"], 3))
    w(f"\nFragility rule: fragile if any one-step perturbation flips the sign of full-sample expectancy → "
      f"**{'fragile' if fragile else 'not fragile'}**.\n")
    if len(R["news"]):
        w("\nNews filter (FX/XAU):\n\n" + md_table(R["news"], 3))
    if len(R["fvg_stats"]):
        w("\nFVG descriptive statistics (15m, 24h horizon — uses future data, reporting only):\n\n")
        w(md_table(R["fvg_stats"]))

    w("\n## 16. Final classification\n")
    w("Rules (declared before running): **Strong** = test exp>0, p<0.01, n≥100, ≥70% positive WF windows, "
      "strategy ≥95th pct of every random control, still >0 at +50% costs, bootstrap 5th-pct return >0, not "
      "fragile. **Moderate** = test exp>0, p<0.05, n≥50, ≥60% WF windows positive, ≥90th pct of controls, "
      ">0 at +25% costs, not fragile. **Weak** = test exp>0 but the above not met. **No evidence** = test "
      "exp≤0 under realistic costs, or below the 75th percentile of any random control.\n\n")
    rows = [dict(market=m, classification=c[0], wf_positive_share=c[1],
                 min_control_percentile=c[2]) for m, c in classes.items()]
    w(md_table(pd.DataFrame(rows)))
    if R["synthetic"]:
        w("\n**Reminder: synthetic null data.** The correct outcome here is 'No evidence'; any other outcome "
          "would point to a bug. Real-market classification is pending real data.\n")

    with open(os.path.join(out_dir, "REPORT.md"), "w") as f:
        f.write("\n".join(L))

    # CSV exports
    for key in ("sessions", "rr", "entry", "model", "confluence_factors", "confluence_scores",
                "score_thresholds", "ablation", "walkforward", "sensitivity", "news", "fvg_stats"):
        if isinstance(R.get(key), pd.DataFrame) and len(R[key]):
            R[key].to_csv(os.path.join(out_dir, f"{key}.csv"), index=False)
    rows = []
    for (m, split, sc), s in perf.items():
        rows.append(dict(market=m, split=split, costs=sc, **s))
    pd.DataFrame(rows).to_csv(os.path.join(out_dir, "performance.csv"), index=False)
    return classes
