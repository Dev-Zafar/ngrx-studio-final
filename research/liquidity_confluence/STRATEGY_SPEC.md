# Strategy specification — Liquidity + Market Structure + Displacement + OB + FVG + Fibonacci Confluence

Every rule below is implemented in code. You can check it without looking at a chart. File references point to the code that implements each rule. Parameters marked **[tuned]** are chosen on training data only (see §17). Everything else was fixed before any backtest ran.

All times are UTC. Bars are labelled by their **open** time. A bar stamped `T` on timeframe `tf` is known only at `T + tf`.

---

## 0. Data and timeframes

| Role | Timeframe | Source |
|---|---|---|
| HTF bias | 4H, 1H | Resampled from 5m |
| Setup | 15m | Resampled from 5m |
| Execution / fills / exits | 5m | Raw input |

Resampling uses `label='left', closed='left'`. An HTF value is mapped to a 15m bar only when the HTF bar's close time is ≤ the 15m bar's close time (`features.map_htf_to_ltf`).

## 1. Market structure (`features.fractal_swings`, `features.market_structure`)

* **Swing high (fractal):** bar *i* where `high[i] > max(high[i-N..i-1])` and `high[i] >= max(high[i+1..i+N])`. Swing lows mirror this. The swing is **confirmed at the close of bar i+N**, and it does not exist before that.
  * N = 2 on 15m, N = 3 on 1H, N = 2 on 4H.
* **Bullish break:** a bar closes above the most recently confirmed swing high that has not yet been broken.
  * **BOS** if the prevailing trend was bullish or undefined.
  * **CHOCH** if the prevailing trend was bearish (the "relevant lower high" is the most recent confirmed swing high).
* Bearish break, BOS and CHOCH mirror the bullish rules.
* **Trend** = direction of the last break. This equals an HH/HL (LL/LH) sequence confirmed by closes.
* HTF bias on each 15m bar = the 1H trend and the 4H trend, as known at that bar's close.

## 2. Liquidity map (`signals.build_view`, `_long_pass`)

A level is **activated** on the first 15m bar that opens after the level becomes known. It is **consumed** when price trades through it.

| Level | Kind | Known at | Life |
|---|---|---|---|
| Previous day high / low (UTC day) | external `pd` | 00:00 | 24 h |
| Previous week high / low (week starts Monday 00:00) | external `pw` | Monday 00:00 | 7 d |
| 1H swing high / low (N=3) | external `h1` | swing confirmation | 7 d |
| 4H swing high / low (N=2) | external `h4` | swing confirmation | 28 d |
| 15m swing high / low (N=2) | internal `sw15` | swing confirmation | 24 h |
| Equal highs / lows: two 15m swings on the same side within 0.10 × ATR15 | internal `eq` | 2nd swing confirmed | 24 h |
| Consolidation: range of the last 16 bars ≤ 2.5 × ATR15 → its high and low | internal `range` | bar close | 8 h |
| Asian session high / low, 00:00–08:00 | session `asia` | 08:00 | 24 h |
| London session high / low, 08:00–13:00 | session `london` | 13:00 | 24 h |
| New York session high / low, 13:00–21:00 | session `ny` | 21:00 | 24 h |

A level below the previous close is **sell-side** liquidity. A level above it is **buy-side** liquidity.

## 3. Liquidity events

### A. Sweep + reversal (long; short is the exact mirror)
1. A 15m bar's low trades below one or more active sell-side levels. The reference level is the lowest level taken in that bar.
2. **Reclaim:** within that bar or the next 3 bars, a bar closes back above the reference level. Otherwise the event is discarded.
3. After the reclaim, a bar closing below the reference level cancels the event (failed sweep).
4. **Confirmation:** within 16 bars (4 h) after the reclaim, a **bullish BOS/CHOCH** closes on 15m.
   * A **bullish displacement** candle must also exist between the sweep low and the BOS bar, inclusive.

### B. Break + continuation (long)
1. A 15m bar trades above an active buy-side level **and closes above it**.
2. Within that bar or the next 2 bars, both of these occur:
   * a bullish BOS/CHOCH;
   * a bullish displacement candle whose close is above the broken level.

A and B are always tested separately. The combined strategy (`model=both`) takes both. If both trigger on the same bar, A takes priority.

## 4. Displacement (`features.displacement`)

A bullish displacement candle meets all of these:

* `close > open`;
* `body / range ≥ disp_body` **[tuned: 0.50 / 0.60 / 0.70]**;
* `range ≥ disp_atr × ATR14(previous bar)` **[tuned: 1.0 / 1.2 / 1.5]**. The multiplier is paired with `disp_body` as loose / base / strict;
* close in the top 20% of the range.

**Strong displacement** (score point): body ≥ 0.70 and range ≥ 2.0 × ATR.

## 5. Impulse leg

* **Leg low:**
  * Reversal: the lowest low from the sweep bar to the BOS bar.
  * Continuation: the lowest low since the last confirmed 15m swing low (at most 64 bars back).
* **Leg high:** the highest high from the leg low to the BOS bar.

## 6. FVG (`features.fvgs`)

* **Bullish FVG** on candles A, B, C: `low(C) > high(A)`. The zone is `[high(A), low(C)]`. It is known at the close of C.
* **Eligible FVG:**
  * inside the leg (A ≥ leg low index, C ≤ BOS bar);
  * size ≥ 0.10 × ATR15;
  * not already filled (no low ≤ high(A) after C).
* If several FVGs qualify, prefer one whose middle candle B is a displacement candle, then the most recent.

## 7. Order block

* **Bullish OB:** the last down-close candle (`close < open`) before the first displacement candle of the leg. The search goes back at most 10 bars, and no further than 2 bars before the leg low.
* The zone is `[low, high]` of that candle.
* It counts as a *valid* OB for scoring only if the displacement follows within 3 bars.

## 8. Point of interest (POI) and Fibonacci

1. POI = OB ∩ FVG if they overlap. Otherwise the FVG. Otherwise the OB. With neither, there is no trade.
2. The Fibonacci band is measured on the leg (low → high): `[high − 0.786·R, high − 0.618·R]`.
3. The POI must intersect the band. The **entry zone** is the intersection.
4. **Entry price** = the proximal edge of the entry zone: its top for longs, its bottom for shorts.

## 9. Confluence score (12 points; `engine.score`)

The spec lists 11 items and asks for a /12 scale. The 12th item was defined before testing.

| # | Point | Condition |
|---|---|---|
| 1 | Liquidity sweep | Model A with a sweep |
| 2 | HTF structure alignment | 1H trend = trade direction |
| 3 | BOS/CHOCH | Structure break present |
| 4 | Strong displacement | See §4 |
| 5 | Valid FVG | §6 |
| 6 | Valid OB | §7, and the OB caused the displacement |
| 7 | OB/FVG overlap | §8 |
| 8 | Fib 0.618–0.786 overlap | §8 |
| 9 | PDH/PDL liquidity | The swept or broken level includes the previous-day high or low |
| 10 | Session liquidity | The swept or broken level includes an Asia, London or NY high/low |
| 11 | 1H + 4H alignment | Both trends = trade direction |
| 12 | External HTF liquidity *(added)* | The swept or broken level includes PWH/PWL or a 1H/4H swing |

**Minimum score** **[tuned: 6 / 7 / 8 / 9]**.

## 10. Mandatory entry conditions

A setup is traded only if all of these hold:

1. **HTF bias:**
   * the 1H or the 4H trend agrees with the trade; **or**
   * *(reversal model only)* the swept level is external liquidity (PDH/PDL, PWH/PWL, 1H/4H swing). This is the "valid reversal condition".
2. A liquidity event from §3: sweep (A) or continuation break (B).
3. Displacement (§4).
4. BOS/CHOCH (§1).
5. A POI inside the Fib band (§8).
6. Score ≥ the minimum score.
7. **Room to liquidity:** `(TP2 − entry) / (entry − SL) ≥ 2.0`.
8. **Cost filter:** estimated round-trip cost ≤ 0.25 R, where the cost is `(2·half-spread + slippage + maker + taker fees) / risk`.
9. **Session filter:** the decision time (close of the BOS bar) falls inside the trading window **[tuned: London 08–12 / NY 13–17 / London+NY / all]**. Unfilled orders are cancelled at the end of the window.
10. **News filter** (FX/XAU; tested both on and off): no fills from 30 min before to 60 min after a scheduled high-impact event.

## 11. Entry execution (`engine.simulate`) **[tuned: limit / confirm]**

**A. Limit**
* The order rests at the entry price from the first 5m bar that opens after the decision.
* A buy fills when `low ≤ entry − half_spread`.
* Expiry: 24 × 15m bars (6 h), the end of the session window, or the arrival of a newer setup, whichever comes first.
* The order is cancelled if price trades beyond the leg high before filling. If the fill and the cancellation happen in the same bar, the order counts as cancelled.

**B. Confirmation**
* After price touches the entry price, wait up to 6 × 5m bars for a bullish 5m bar with `close > open` and `close > previous 5m high`.
* The stop must not be touched while waiting.
* Enter at the next 5m open plus half-spread plus slippage (taker order).
* The trade is taken only if room to TP2 at the actual entry is still ≥ 2R.

## 12. Stop loss

`SL = leg low − sl_buffer × ATR15` **[tuned: 0.10 / 0.25 / 0.50]**.

This is structural, below the sweep or leg low. There are no fixed pip stops.

## 13. Targets (`engine._exit_fixed`, `engine._exit_loop`) **[tuned exit model]**

* **TP1** = leg high (nearest internal liquidity).
* **TP2** = nearest active 15m swing / equal high / range high / 1H swing above TP1. If none exists, TP2 = TP1 + leg range (flagged in the trade log).
* **TP3** = nearest PDH / PWH / 4H / 1H swing above TP2. If none exists, TP3 = TP2 + leg range.

Exit models:

| Model | Rule |
|---|---|
| `rr1.5`, `rr2.0`, `rr2.5`, `rr3.0`, `rr4.0` | Fixed R multiple |
| `tp2` | 100% exit at TP2 |
| `partial` | 50% at TP1, stop moved to breakeven, remaining 50% at TP3 |
| `trail` | Once +1R is reached, stop = max(breakeven, highest high − 2·ATR15); no fixed target |

All trades have a 48 h time stop.

## 14. Risk management

* Base risk 0.5% of equity per trade, compounded. Also reported at 0.25% and 1%.
* One position per market. No pyramiding, averaging, grid or martingale.
* **Daily loss limit:** once realised net R for the UTC day ≤ −2R, no new orders that day. Applied per market.

## 15. Costs (`config.REALISTIC_COSTS`, `config.COST_SCENARIOS`)

| Market | Half spread | Stop / market slippage | Maker / taker fee | Funding |
|---|---|---|---|---|
| BTCUSDT perp | 0.5 bp | 1.5 bp | 0.02% / 0.05% | 0.01% per 8 h (longs pay) |
| ETHUSDT perp | 0.75 bp | 2.5 bp | 0.02% / 0.05% | 0.01% per 8 h |
| EURUSD | 0.1 pip | 0.2 pip | $7/lot RT (0.0035%/side) | — |
| GBPUSD | 0.25 pip | 0.3 pip | same | — |
| USDJPY | 0.2 pip | 0.3 pip | same | — |
| XAUUSD | $0.10 | $0.10 | same | — |

Scenarios:

| Scenario | Spread | Slippage | Fees | Funding |
|---|---|---|---|---|
| zero | 0 | 0 | 0 | 0 |
| realistic | 1× | 1× | 1× | 1× |
| +25% | 1.25× | 1.25× | 1.25× | 1.25× |
| +50% | 1.5× | 1.5× | 1.5× | 1.5× |
| slippage | 1× | 3× | 1× | 1× |
| adverse | 2× | 3× | 1.5× | 2× |

Intrabar ambiguity is always resolved against the trade:
* If the stop and the target are hit in the same 5m bar, the stop counts first.
* A limit-fill bar can stop out but cannot take profit.

## 16. News events (`lcs/news.py`)

* **FOMC** 2023–2026: hard-coded.
* **NFP:** approximated as the first Friday at 08:30 ET.
* **CPI, ECB, BoE and BoJ** must be supplied in `data/news_events.csv`. Without that file they are **not** filtered, and the report says so.

## 17. Selection protocol (`experiments.py`)

1. **Chronological split:** 60% train / 20% validation / 20% test.
2. **Stage 1 (train):** 3 displacement settings × 3 SL buffers × 4 minimum scores. Uses limit entry, 2R exit, all sessions.
3. **Stage 2 (train):** with the stage-1 winner fixed, 2 entry models × 8 exit models × 4 sessions.
4. **Objective:** t-statistic of pooled net R (realistic costs). A config with fewer than 10 trades per market is ineligible.
5. **Validation:** the 5 best training configs are compared on validation, and the best one is frozen.
6. **Test:** the frozen config runs once on the test split.
7. **Walk-forward:** repeat steps 2–5 on rolling windows of 12 months train / 3 months validation / 3 months test, stepping 3 months. Each test window is reported.

## 18. Pre-declared evidence classification

See REPORT §16. Summary:

* **Strong:** OOS p < 0.01, n ≥ 100, ≥ 70% of walk-forward windows positive, ≥ 95th percentile of every random control, positive at +50% cost, bootstrap 5th percentile > 0, not fragile.
* **Moderate:** p < 0.05, n ≥ 50, ≥ 60% of walk-forward windows positive, ≥ 90th percentile of every control, positive at +25% cost, not fragile.
* **Weak:** positive OOS expectancy that doesn't meet the Moderate bar.
* **No evidence:** OOS expectancy ≤ 0, or below the 75th percentile of any control.
