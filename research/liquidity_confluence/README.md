# Liquidity-confluence strategy — research and backtest framework

This folder is a mechanical, look-ahead-safe implementation and backtest of the *Liquidity + Market Structure + Displacement + OB + FVG + Fibonacci Confluence* strategy for BTCUSDT, ETHUSDT, EURUSD, GBPUSD, USDJPY and XAUUSD.

> **Status: no real-market results yet.** The environment that built this framework could not reach any market-data host. Binance, Dukascopy, Yahoo, Kraken, Coinbase, Stooq, Kaggle and HuggingFace were all blocked by its network policy. The only full run so far (`results/synthetic_null/`) used **synthetic random-walk data with no edge**. That run checks the engine; it is **not** evidence about the strategy. To get the real verdict, run the two commands in *Quick start* on a machine with internet access.

## Quick start

```bash
pip install -r requirements.txt
python download_data.py --start 2023-01-01 --end 2026-09-28   # ~6 markets, 5m bars
# optional: add verified CPI/ECB/BoE/BoJ events to data/news_events.csv
python run_backtest.py                                        # writes results/real/REPORT.md
python -m pytest -q tests/                                    # look-ahead & symmetry tests
python run_backtest.py --synthetic                            # engine check on null data
```

## Clean dataset requirements

| Item | Requirement |
|---|---|
| File | `data/<MARKET>_5m.parquet` or `.csv` |
| Columns | `time` (bar **open**, UTC), `open`, `high`, `low`, `close`, optional `volume`, optional `spread` |
| Resolution | 5-minute. 15m, 1H and 4H are resampled from it, so all timeframes are internally consistent. |
| History | 2023-01-01 → present (≥ 3 years) |
| Crypto | Binance USDT-M perpetual futures klines (the funding cost model assumes perps) |
| FX / XAU | Mid prices from bid/ask (Dukascopy); broker-feed CSVs also work via `--from-csv` |
| Integrity | Sorted and unique timestamps; `high ≥ max(open, close)`; `low ≤ min(open, close)`; no gaps except FX weekends (checked by `lcs.data.validate`, reported in REPORT §3) |
| News | `data/news_events.csv`: `time_utc,currency,event` for CPI/ECB/BoE/BoJ. FOMC is built in; NFP is approximated by a rule. |
| Survivorship | Not applicable: fixed, pre-declared list of six continuously traded instruments |

**If you only have 15m data:** the 5m execution layer can't be rebuilt. That affects limit fills, stop/target ordering inside a 15m bar, and the 5m confirmation entry. In that case, run with 15m bars as the "5m" input, and treat entry-mode B and intrabar ordering as approximate. Everything else still works: HTF bias, structure, liquidity map, FVG, OB and Fib.

## Layout

| Path | Contents |
|---|---|
| `STRATEGY_SPEC.md` | **Complete mechanical rules** (deliverable 1 and 15) |
| `lcs/config.py` | Parameters, sessions, cost models, cost-stress scenarios |
| `lcs/data.py` | Loading, validation, resampling, synthetic null generator |
| `lcs/features.py` | ATR, fractal swings, BOS/CHOCH state machine, displacement, FVG, HTF mapping |
| `lcs/signals.py` | Liquidity map, sweeps and continuation breaks, OB/FVG/Fib POI, targets. Long logic only; shorts come from a price-negated mirror. |
| `lcs/engine.py` | Scoring, mandatory filters, 5m execution engine (limit / confirmation entries, 8 exit models, costs, daily loss limit) |
| `lcs/news.py` | Event calendar and blackout windows |
| `lcs/metrics.py` | All statistics, Monte Carlo (permutation and bootstrap) |
| `lcs/baselines.py` | Five random control strategies |
| `lcs/experiments.py` | Train/validation/test selection, walk-forward, ablation, sensitivity, cost stress |
| `lcs/report.py` | REPORT.md, charts, CSVs |
| `tests/test_no_lookahead.py` | Truncation tests (signals and trades unchanged when future data is removed) and a long/short mirror test |
| `download_data.py` | Binance and Dukascopy downloaders; generic CSV importer |

## Outputs (`results/<run>/`)

| Deliverable | File |
|---|---|
| Trade-by-trade CSV | `trades.csv` (every trade, with split label, score components, costs, R) |
| Equity and drawdown curves | `equity_drawdown.png` |
| Monthly table | `monthly_net_R.csv`, REPORT §4 |
| Market / session / RR / entry / model comparison | REPORT §4–8, `sessions.csv`, `rr.csv`, `entry.csv`, `model.csv` |
| Confluence analysis | REPORT §9, `confluence_factors.csv`, `confluence_scores.csv`, `score_thresholds.csv` |
| Ablation study | REPORT §10, `ablation.csv` |
| Random baselines | REPORT §11 |
| Monte Carlo | REPORT §13, `monte_carlo_*.png` |
| Out-of-sample and walk-forward | REPORT §14, `walkforward.csv` |
| Robustness and sensitivity | REPORT §15, `sensitivity.csv`, `performance.csv` (every market × split × cost scenario) |

## Bias controls

* **Look-ahead:**
  * Swings exist only after N confirming bars.
  * HTF values are used only after their bar closes.
  * Orders are worked from the first 5m bar after the decision bar closes.
  * Enforced by truncation tests.
* **Intrabar ambiguity** always resolves against the trade:
  * stop before target in the same bar;
  * no take-profit on the limit-fill bar;
  * a fill and a cancellation in the same bar count as cancelled.
* **Selection bias:**
  * one shared parameter set for all markets;
  * small pre-declared grids;
  * a minimum-trade eligibility rule;
  * validation-based pick;
  * the test split is touched once.
* **No cherry-picking:** every market, split, session, exit and ablation is reported, including the losing ones.

## Known limitations

* Crypto funding uses a constant 0.01%/8h. Actual history is downloaded to `data/<M>_funding.parquet` but not yet used.
* FX swap/rollover is ignored. Trades are capped at 48 h.
* FX spreads come from a fixed cost model, not the per-bar `spread` column.
* The pooled equity curve compounds trades from all markets sequentially. It is not a portfolio simulation with overlapping positions.
* NFP dates are rule-approximated. CPI/ECB/BoE/BoJ need a user-supplied file.
