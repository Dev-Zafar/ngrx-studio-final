"""Experiment orchestration.

Protocol (fixed before any result was seen):
 1. Chronological split of the common date range: 60% train / 20% validation /
    20% final test.
 2. Stage 1 (TRAIN only): grid over displacement thresholds x SL buffer x
    minimum score (3 x 3 x 4 = 36 configs) with default execution
    (limit entry, fixed 2R, all sessions).
 3. Stage 2 (TRAIN only): with stage-1 winner fixed, grid over entry model x
    exit model x session (2 x 8 x 4 = 64 configs).
 4. The 5 best stage-2 configs (train) are compared on VALIDATION; the best
    validation config is frozen as the final strategy.
 5. The final config is run ONCE on the TEST split.  Nothing is re-tuned.
 Objective everywhere: t-statistic of the pooled per-trade net R (realistic
 costs) across all markets - rewards expectancy AND sample size.
 One shared parameter set is used for all markets (fewer degrees of freedom);
 every market is nevertheless reported individually.
"""
from __future__ import annotations

import itertools
import multiprocessing as mp
import os
import time
from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd

from .baselines import run_controls
from .config import Params, cost_for, is_fx, COST_SCENARIOS
from .data import MarketData, load_market, validate
from .engine import Bars, prepare, simulate
from .features import atr as atr_fn, displacement as disp_fn, fvg_descriptive
from .metrics import summarize, monte_carlo
from .news import load_events, blackout_intervals
from .signals import generate_candidates, gen_key

DISP_GRID = [(0.50, 1.00), (0.60, 1.20), (0.70, 1.50)]
SL_BUF_GRID = [0.10, 0.25, 0.50]
SCORE_GRID = [6, 7, 8, 9]
ENTRY_GRID = ["limit", "confirm"]
EXIT_GRID = ["rr1.5", "rr2.0", "rr2.5", "rr3.0", "rr4.0", "tp2", "partial", "trail"]
SESSION_GRID = ["london", "ny", "london_ny", "all"]

ABLATIONS = [
    ("1 no liquidity sweep", dict(use_sweep=False)),
    ("2 no BOS/CHOCH", dict(use_bos=False)),
    ("3 no FVG", dict(use_fvg=False)),
    ("4 no order block", dict(use_ob=False)),
    ("5 no Fibonacci", dict(use_fib=False)),
    ("6 no session filter", dict(use_session_filter=False)),
    ("7 no HTF bias", dict(use_htf=False)),
    ("8 no displacement", dict(use_displacement=False)),
    ("9 no liquidity targets", dict(use_liq_targets=False)),
]

_MD: Dict[str, MarketData] = {}


def _gen_worker(args):
    market, p = args
    return (market, gen_key(p)), generate_candidates(_MD[market], p)


def t_stat(R: np.ndarray) -> float:
    if len(R) < 3 or np.std(R, ddof=1) == 0:
        return -np.inf
    return float(np.mean(R) / (np.std(R, ddof=1) / np.sqrt(len(R))))


@dataclass
class Split:
    name: str
    t0: int
    t1: int

    @property
    def label(self):
        return f"{pd.Timestamp(self.t0, tz='UTC').date()} -> {pd.Timestamp(self.t1, tz='UTC').date()}"


class Lab:
    def __init__(self, markets, data_dir, synthetic=False, log=print):
        self.log = log
        self.markets = list(markets)
        self.synthetic = synthetic
        self.md: Dict[str, MarketData] = {}
        self.bars: Dict[str, Bars] = {}
        self.quality = {}
        for m in self.markets:
            md = load_market(m, data_dir)
            self.md[m] = md
            self.bars[m] = Bars.from_df(md.m5)
            self.quality[m] = validate(md.m5, m)
        _MD.update(self.md)
        self.events, self.events_src = load_events(data_dir)
        self.blackout = {m: blackout_intervals(self.events, m) for m in self.markets}
        start = min(md.m5.index[0] for md in self.md.values()).floor("D")
        end = max(md.m5.index[-1] for md in self.md.values()).ceil("D")
        span = end - start
        a, b = start + 0.6 * span, start + 0.8 * span
        a, b = a.floor("D"), b.floor("D")
        self.start, self.end = start, end
        self.splits = {
            "train": Split("train", start.value, a.value),
            "validation": Split("validation", a.value, b.value),
            "test": Split("test", b.value, end.value),
            "full": Split("full", start.value, end.value),
        }
        self.cache = {}

    # ------------------------------------------------------------------ core
    def pregen(self, plist: List[Params]):
        todo = []
        for p in plist:
            for m in self.markets:
                if (m, gen_key(p)) not in self.cache and (m, gen_key(p)) not in [(x[0], gen_key(x[1])) for x in todo]:
                    todo.append((m, p))
        if not todo:
            return
        t = time.time()
        with mp.get_context("fork").Pool(min(4, os.cpu_count() or 1)) as pool:
            for key, df in pool.imap_unordered(_gen_worker, todo):
                self.cache[key] = df
        self.log(f"  generated {len(todo)} candidate sets in {time.time()-t:.0f}s")

    def cands(self, m, p):
        k = (m, gen_key(p))
        if k not in self.cache:
            self.cache[k] = generate_candidates(self.md[m], p)
        return self.cache[k]

    def run(self, m, p: Params, split: str = "full", scenario="realistic") -> pd.DataFrame:
        sp = self.splits[split]
        return self.run_window(m, p, sp.t0, sp.t1, scenario)

    def run_window(self, m, p, t0, t1, scenario="realistic"):
        cost = cost_for(m, scenario)
        pc = prepare(self.cands(m, p), p, cost, t0, t1)
        tr = simulate(pc, self.bars[m], p, cost, self.blackout[m])
        if len(tr):
            tr["market"] = m
        return tr

    def pooled(self, p, split="full", scenario="realistic", window=None):
        out = {}
        for m in self.markets:
            if window:
                out[m] = self.run_window(m, p, window[0], window[1], scenario)
            else:
                out[m] = self.run(m, p, split, scenario)
        frames = [t for t in out.values() if len(t)]
        allt = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
        return out, allt

    def objective(self, p, window, min_per_market: int = 10) -> tuple:
        """t-stat of pooled net R; configs with < min_per_market trades per
        market (on average) are ineligible (-inf) to avoid selecting on noise."""
        _, allt = self.pooled(p, window=window)
        R = allt.R.values if len(allt) else np.array([])
        ts = t_stat(R)
        if len(R) < min_per_market * len(self.markets):
            ts = -1e9 + len(R)          # ineligible; ties broken by sample size
        return ts, len(R), (R.mean() if len(R) else np.nan)

    # ------------------------------------------------------------- selection
    def select(self, train_w, val_w, base: Params, verbose=True):
        stage1 = [base.with_(disp_body=db, disp_atr=da, sl_buffer_atr=sb, min_score=ms,
                             entry_mode="limit", exit_mode="rr2.0", session="all")
                  for (db, da), sb, ms in itertools.product(DISP_GRID, SL_BUF_GRID, SCORE_GRID)]
        self.pregen(stage1)
        res1 = []
        for p in stage1:
            ts, n, e = self.objective(p, train_w)
            res1.append((ts, n, e, p))
        res1.sort(key=lambda x: x[0], reverse=True)
        best1 = res1[0][3]
        stage2 = [best1.with_(entry_mode=en, exit_mode=ex, session=se)
                  for en, ex, se in itertools.product(ENTRY_GRID, EXIT_GRID, SESSION_GRID)]
        res2 = []
        for p in stage2:
            ts, n, e = self.objective(p, train_w)
            res2.append((ts, n, e, p))
        res2.sort(key=lambda x: x[0], reverse=True)
        top = res2[:5]
        resv = []
        for ts, n, e, p in top:
            vts, vn, ve = self.objective(p, val_w, min_per_market=3)
            resv.append((vts, vn, ve, ts, n, e, p))
        resv.sort(key=lambda x: x[0], reverse=True)
        final = resv[0][6]
        return final, res1, res2, resv


def param_label(p: Params) -> str:
    return (f"disp body>={p.disp_body:.2f} range>={p.disp_atr:.2f}xATR; SLbuf={p.sl_buffer_atr:.2f}xATR"
            f"; minScore={p.min_score}; entry={p.entry_mode}; exit={p.exit_mode}; session={p.session}")


def run_all(data_dir, out_dir, markets, synthetic=False, mc_sims=10_000, control_reps=200,
            log=print) -> dict:
    os.makedirs(out_dir, exist_ok=True)
    T0 = time.time()
    lab = Lab(markets, data_dir, synthetic, log)
    R: dict = {"synthetic": synthetic, "markets": markets, "quality": lab.quality,
               "events_src": lab.events_src,
               "splits": {k: v.label for k, v in lab.splits.items()}}
    base = Params()
    tw = (lab.splits["train"].t0, lab.splits["train"].t1)
    vw = (lab.splits["validation"].t0, lab.splits["validation"].t1)

    # ---------------------------------------------------------- 1. selection
    log("[1] parameter selection on TRAIN, top-5 checked on VALIDATION")
    final, res1, res2, resv = lab.select(tw, vw, base)
    R["final_params"] = final.to_dict()
    R["final_label"] = param_label(final)
    R["stage1"] = [dict(t=x[0], n=x[1], exp=x[2], cfg=param_label(x[3])) for x in res1]
    R["stage2"] = [dict(t=x[0], n=x[1], exp=x[2], cfg=param_label(x[3])) for x in res2]
    R["validation_pick"] = [dict(val_t=x[0], val_n=x[1], val_exp=x[2], train_t=x[3], train_n=x[4],
                                 train_exp=x[5], cfg=param_label(x[6])) for x in resv]
    log("    final: " + param_label(final))

    # ---------------------------------------------- 2. main per-market tables
    log("[2] per-market performance by split and cost scenario")
    perf = {}
    trades_store = {}
    for split in ("train", "validation", "test", "full"):
        for sc in COST_SCENARIOS:
            by_m, allt = lab.pooled(final, split, sc)
            for m, t in by_m.items():
                perf[(m, split, sc)] = summarize(t, final.risk_pct, pd.Timestamp(lab.splits[split].t0, tz="UTC"),
                                                 pd.Timestamp(lab.splits[split].t1, tz="UTC"))
                if sc == "realistic":
                    trades_store[(m, split)] = t
            perf[("POOLED", split, sc)] = summarize(allt, final.risk_pct) if len(allt) else {"trades": 0}
    R["perf"] = perf
    full_tr = []
    for m in markets:
        t = trades_store[(m, "full")]
        if len(t):
            t = t.copy()
            t["split"] = np.select([t.decision_time < pd.Timestamp(lab.splits["validation"].t0, tz="UTC"),
                                    t.decision_time < pd.Timestamp(lab.splits["test"].t0, tz="UTC")],
                                   ["train", "validation"], "test")
            full_tr.append(t)
    trades_all = pd.concat(full_tr, ignore_index=True) if full_tr else pd.DataFrame()
    R["trades_all"] = trades_all
    if len(trades_all):
        trades_all.drop(columns=["idx"], errors="ignore").to_csv(os.path.join(out_dir, "trades.csv"), index=False)

    # risk levels
    R["risk_levels"] = {}
    for rp in (0.25, 0.5, 1.0):
        for split in ("test", "full"):
            by_m, allt = lab.pooled(final.with_(risk_pct=rp), split)
            R["risk_levels"][(rp, split)] = summarize(allt, rp) if len(allt) else {"trades": 0}

    # ------------------------------------------------ 3. variant comparisons
    log("[3] session / RR / entry / model comparisons")

    def compare(variants, splits=("train", "test", "full")):
        rows = []
        for name, p in variants:
            for split in splits:
                by_m, allt = lab.pooled(p, split)
                s = summarize(allt, p.risk_pct) if len(allt) else {"trades": 0}
                row = dict(variant=name, split=split, **{k: s.get(k) for k in (
                    "trades", "win_rate", "expectancy_R", "profit_factor", "net_R", "max_dd_pct", "p_value")})
                for m in markets:
                    row[m] = by_m[m].R.mean() if len(by_m[m]) else np.nan
                rows.append(row)
        return pd.DataFrame(rows)

    R["sessions"] = compare([(s, final.with_(session=s)) for s in SESSION_GRID])
    R["rr"] = compare([(e, final.with_(exit_mode=e)) for e in EXIT_GRID])
    R["entry"] = compare([(e, final.with_(entry_mode=e)) for e in ENTRY_GRID])
    R["model"] = compare([(mo, final.with_(model=mo)) for mo in ("reversal", "continuation", "both")])

    # news (FX / XAU only)
    news_rows = []
    for m in markets:
        if not is_fx(m):
            continue
        for split in ("train", "test", "full"):
            for nf in (False, True):
                t = lab.run(m, final.with_(news_filter=nf), split)
                s = summarize(t, final.risk_pct)
                row = dict(market=m, split=split, mode="avoid news" if nf else "trade through news",
                           trades=s.get("trades"), expectancy_R=s.get("expectancy_R"),
                           profit_factor=s.get("profit_factor"), net_R=s.get("net_R"))
                if not nf and len(t):
                    inn = t[t.news]
                    row.update(in_news_trades=len(inn), in_news_exp=inn.R.mean() if len(inn) else np.nan,
                               in_news_net_R=inn.R.sum() if len(inn) else 0.0)
                news_rows.append(row)
    R["news"] = pd.DataFrame(news_rows)

    # --------------------------------------------------- 4. confluence study
    log("[4] confluence factor analysis")
    loose = final.with_(min_score=0)
    conf = {}
    for split in ("train", "test"):
        _, allt = lab.pooled(loose, split)
        conf[split] = allt
    factors = ["k_sweep", "k_bos", "k_choch", "k_strong", "k_fvg", "k_ob", "k_ob_caused", "k_overlap",
               "k_fib", "k_pd", "k_session", "k_external"]
    frows = []
    for split, t in conf.items():
        if not len(t):
            continue
        t = t.assign(htf_1h=t.t1 == 1, htf_1h_4h=(t.t1 == 1) & (t.t4 == 1))
        for f in factors + ["htf_1h", "htf_1h_4h"]:
            a, b = t[t[f].astype(bool)], t[~t[f].astype(bool)]
            frows.append(dict(split=split, factor=f, n_with=len(a), exp_with=a.R.mean() if len(a) else np.nan,
                              wr_with=(a.R > 0).mean() * 100 if len(a) else np.nan,
                              n_without=len(b), exp_without=b.R.mean() if len(b) else np.nan,
                              wr_without=(b.R > 0).mean() * 100 if len(b) else np.nan))
    R["confluence_factors"] = pd.DataFrame(frows)
    srows = []
    for split, t in conf.items():
        if not len(t):
            continue
        for sc_, g in t.groupby("score"):
            srows.append(dict(split=split, score=int(sc_), trades=len(g), expectancy_R=g.R.mean(),
                              win_rate=(g.R > 0).mean() * 100, net_R=g.R.sum()))
    R["confluence_scores"] = pd.DataFrame(srows)
    thr = []
    for ms in SCORE_GRID:
        for split in ("train", "validation", "test"):
            _, allt = lab.pooled(final.with_(min_score=ms), split)
            s = summarize(allt, final.risk_pct) if len(allt) else {"trades": 0}
            thr.append(dict(min_score=ms, split=split, trades=s.get("trades"), expectancy_R=s.get("expectancy_R"),
                            profit_factor=s.get("profit_factor"), win_rate=s.get("win_rate")))
    R["score_thresholds"] = pd.DataFrame(thr)

    # --------------------------------------------------------- 5. ablations
    log("[5] ablations")
    abl_params = [("0 complete strategy", final)] + [(n, final.with_(**kw)) for n, kw in ABLATIONS]
    lab.pregen([p for _, p in abl_params])
    rows = []
    for name, p in abl_params:
        for split in ("train", "validation", "test", "full"):
            by_m, allt = lab.pooled(p, split)
            s = summarize(allt, p.risk_pct) if len(allt) else {"trades": 0}
            row = dict(variant=name, split=split, **{k: s.get(k) for k in (
                "trades", "win_rate", "expectancy_R", "profit_factor", "net_R", "max_dd_pct", "p_value")})
            for m in markets:
                row[m] = by_m[m].R.mean() if len(by_m[m]) else np.nan
            rows.append(row)
    R["ablation"] = pd.DataFrame(rows)

    # ------------------------------------------------- 6. random baselines
    log("[6] random control strategies")
    ctrl = {}
    for split in ("test", "full"):
        sp = lab.splits[split]
        for m in markets:
            st_tr = trades_store[(m, split)]
            n = len(st_tr)
            if n == 0:
                continue
            ctrl[(m, split)] = dict(
                strategy_exp=st_tr.R.mean(), strategy_n=n,
                controls=run_controls(lab.md[m], lab.bars[m], final, cost_for(m), sp.t0, sp.t1, n, st_tr,
                                      reps=control_reps, blackout=lab.blackout[m]))
    R["controls"] = ctrl

    # -------------------------------------------------- 7. walk-forward
    log("[7] walk-forward (train 12m / validate 3m / test 3m, step 3m)")
    wf = []
    months = pd.date_range(lab.start, lab.end, freq="MS", tz="UTC")
    k = 0
    while True:
        if k + 18 >= len(months):
            break
        a, b, c_, d = months[k], months[k + 12], months[k + 15], months[k + 18]
        fin, _, _, _ = lab.select((a.value, b.value), (b.value, c_.value), base, verbose=False)
        by_m, allt = lab.pooled(fin, window=(c_.value, d.value))
        s = summarize(allt, fin.risk_pct) if len(allt) else {"trades": 0}
        row = dict(window=k // 3 + 1, train=f"{a.date()}..{b.date()}", validate=f"{b.date()}..{c_.date()}",
                   test=f"{c_.date()}..{d.date()}", selected=param_label(fin), trades=s.get("trades", 0),
                   expectancy_R=s.get("expectancy_R"), profit_factor=s.get("profit_factor"),
                   net_R=s.get("net_R"), win_rate=s.get("win_rate"), max_dd_pct=s.get("max_dd_pct"))
        for m in markets:
            row[m] = by_m[m].R.sum() if len(by_m[m]) else 0.0
        wf.append(row)
        wf_tr = allt
        R.setdefault("wf_trades", []).append(wf_tr)
        log(f"    window {row['window']}: test {row['test']} trades={row['trades']} "
            f"exp={row['expectancy_R'] if row['expectancy_R'] is not None else float('nan'):.3f}")
        k += 3
    R["walkforward"] = pd.DataFrame(wf)
    wf_frames = [x for x in R.get("wf_trades", []) if len(x)]
    R["wf_concat"] = summarize(pd.concat(wf_frames), final.risk_pct) if wf_frames else {"trades": 0}

    # -------------------------------------------------- 8. sensitivity
    log("[8] parameter sensitivity")
    di = DISP_GRID.index((final.disp_body, final.disp_atr))
    bi = SL_BUF_GRID.index(final.sl_buffer_atr)
    pert = [("selected", final)]
    for j in (di - 1, di + 1):
        if 0 <= j < len(DISP_GRID):
            pert.append((f"disp body/ATR = {DISP_GRID[j]}", final.with_(disp_body=DISP_GRID[j][0], disp_atr=DISP_GRID[j][1])))
    for j in (bi - 1, bi + 1):
        if 0 <= j < len(SL_BUF_GRID):
            pert.append((f"SL buffer = {SL_BUF_GRID[j]}", final.with_(sl_buffer_atr=SL_BUF_GRID[j])))
    for ms in (final.min_score - 1, final.min_score + 1):
        pert.append((f"min score = {ms}", final.with_(min_score=ms)))
    pert += [
        ("swing N (15m) = 3", final.with_(swing_n_15m=3)),
        ("swing N (1h) = 2", final.with_(swing_n_1h=2)),
        ("fib zone 0.5-0.786", final.with_(fib_lo=0.5)),
        ("fib zone 0.618-0.886", final.with_(fib_hi=0.886)),
        ("confirm window 12 bars", final.with_(confirm_bars=12)),
        ("confirm window 20 bars", final.with_(confirm_bars=20)),
        ("order expiry 16 bars", final.with_(order_expiry_bars=16)),
        ("order expiry 32 bars", final.with_(order_expiry_bars=32)),
        ("reclaim window 2 bars", final.with_(reclaim_bars=2)),
        ("equal-level tol 0.2 ATR", final.with_(eq_tol_atr=0.2)),
        ("max cost 0.15R", final.with_(max_cost_r=0.15)),
        ("max cost 0.35R", final.with_(max_cost_r=0.35)),
        ("min RR to TP2 = 1.5", final.with_(min_rr_to_tp2=1.5)),
        ("min RR to TP2 = 2.5", final.with_(min_rr_to_tp2=2.5)),
    ]
    lab.pregen([p for _, p in pert])
    rows = []
    for name, p in pert:
        row = dict(variant=name)
        for split in ("train", "test", "full"):
            _, allt = lab.pooled(p, split)
            row[f"{split}_n"] = len(allt)
            row[f"{split}_exp"] = allt.R.mean() if len(allt) else np.nan
            if split == "full":
                s = summarize(allt, p.risk_pct) if len(allt) else {}
                row["full_pf"] = s.get("profit_factor"); row["full_dd"] = s.get("max_dd_pct")
        rows.append(row)
    R["sensitivity"] = pd.DataFrame(rows)

    # -------------------------------------------------- 9. Monte Carlo
    log("[9] Monte Carlo")
    mc = {}
    for split in ("test", "full"):
        for m in markets + ["POOLED"]:
            if m == "POOLED":
                t = pd.concat([trades_store[(x, split)] for x in markets if len(trades_store[(x, split)])]) \
                    if any(len(trades_store[(x, split)]) for x in markets) else pd.DataFrame()
                if len(t):
                    t = t.sort_values("exit_time")
            else:
                t = trades_store[(m, split)]
            if len(t) >= 2:
                mc[(m, split)] = monte_carlo(t.R.values, final.risk_pct, n_sims=mc_sims)
    R["mc"] = mc

    # -------------------------------------------------- 10. descriptive FVG
    fv = []
    for m in markets:
        df = lab.md[m].m15
        h, l, c, o = df.high.values, df.low.values, df.close.values, df.open.values
        A = atr_fn(h, l, c, final.atr_len)
        db, ds = disp_fn(o, h, l, c, A, final.disp_body, final.disp_atr, final.disp_close_pct)
        d = fvg_descriptive(df, A, db, ds)
        if len(d):
            fv.append(dict(market=m, fvgs=len(d), median_size_atr=d.size_atr.median(),
                           by_displacement_pct=d.by_displacement.mean() * 100,
                           retraced_24h_pct=d.retraced.mean() * 100, filled_24h_pct=d.filled.mean() * 100,
                           median_bars_to_fill=d.bars_to_fill.median()))
    R["fvg_stats"] = pd.DataFrame(fv)
    R["trades_store"] = trades_store
    R["lab"] = lab
    R["runtime_min"] = (time.time() - T0) / 60
    log(f"done in {R['runtime_min']:.1f} min")
    return R
