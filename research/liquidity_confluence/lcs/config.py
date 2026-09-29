"""Configuration: strategy parameters, market cost models, sessions.

Every number here was fixed BEFORE any backtest was run. Parameters that are
tuned are only tuned on training data (see experiments.py); everything else is
a fixed a-priori choice and is documented in STRATEGY_SPEC.md.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace, asdict
from typing import Dict, Tuple

# --------------------------------------------------------------------------
# Sessions (all UTC, [start_hour, end_hour) )
# --------------------------------------------------------------------------
# Liquidity-range sessions: used to build session high/low liquidity levels.
LIQ_SESSIONS: Dict[str, Tuple[int, int]] = {
    "asia": (0, 8),
    "london": (8, 13),
    "ny": (13, 21),
}
# Trading windows: used by the session filter (spec section 13).
TRADE_WINDOWS: Dict[str, Tuple[Tuple[int, int], ...]] = {
    "london": ((8, 12),),
    "ny": ((13, 17),),
    "london_ny": ((8, 12), (13, 17)),
    "all": ((0, 24),),
}


# --------------------------------------------------------------------------
# Strategy parameters
# --------------------------------------------------------------------------
@dataclass(frozen=True)
class Params:
    # --- swing detection (fractal: pivot must be the extreme of N bars on each side)
    swing_n_15m: int = 2          # confirmed 2 bars (30 min) after the pivot
    swing_n_1h: int = 3           # confirmed 3 bars (3 h) after the pivot
    swing_n_4h: int = 2           # confirmed 2 bars (8 h) after the pivot
    atr_len: int = 14

    # --- displacement (tuned on TRAINING only; grid in experiments.DISP_GRID)
    disp_body: float = 0.60       # body / range
    disp_atr: float = 1.20        # range / ATR14
    disp_close_pct: float = 0.20  # close within top/bottom 20% of range
    strong_body: float = 0.70     # "strong displacement" score point
    strong_atr: float = 2.00

    # --- liquidity
    eq_tol_atr: float = 0.10      # equal highs/lows tolerance (x ATR15)
    internal_swing_life: int = 96     # 15m bars (24 h)
    h1_swing_life: int = 7 * 24 * 4   # 1 week in 15m bars
    h4_swing_life: int = 28 * 24 * 4  # 4 weeks in 15m bars
    session_level_life: int = 96
    range_len: int = 16           # consolidation lookback (15m bars)
    range_max_atr: float = 2.5    # range height <= 2.5 * ATR -> consolidation
    range_life: int = 32

    # --- sweep / confirmation windows (15m bars)
    reclaim_bars: int = 3         # close back inside within 3 bars of the breach
    confirm_bars: int = 16        # BOS + displacement must follow within 4 h
    cont_bos_bars: int = 2        # continuation: BOS within 2 bars of the break

    # --- setup construction
    min_fvg_atr: float = 0.10     # FVG must be >= 0.1 ATR
    ob_lookback: int = 10         # search back 10 bars from displacement for OB
    fib_lo: float = 0.618
    fib_hi: float = 0.786
    order_expiry_bars: int = 24   # limit order lives 6 h (15m bars)
    max_hold_hours: float = 48.0

    # --- risk / filters
    sl_buffer_atr: float = 0.25   # tuned on TRAINING only
    min_score: int = 7            # tuned on TRAINING only
    min_rr_to_tp2: float = 2.0    # spec rule 9
    max_cost_r: float = 0.25      # spec rule 10: est. round-trip cost <= 0.25 R
    daily_loss_limit_r: float = 2.0
    risk_pct: float = 0.5         # % equity per trade

    # --- execution variant (stage-2, TRAINING only)
    model: str = "both"           # "reversal" | "continuation" | "both"
    entry_mode: str = "limit"     # "limit" | "confirm"
    exit_mode: str = "rr2.0"      # rr1.5|rr2.0|rr2.5|rr3.0|rr4.0|tp2|partial|trail
    session: str = "all"          # london | ny | london_ny | all
    news_filter: bool = False     # FX/XAU only
    confirm_window_5m: int = 6    # confirmation entry: 30 min after touch

    # --- ablation switches (all True = complete strategy)
    use_sweep: bool = True
    use_bos: bool = True
    use_fvg: bool = True
    use_ob: bool = True
    use_fib: bool = True
    use_session_filter: bool = True
    use_htf: bool = True
    use_displacement: bool = True
    use_liq_targets: bool = True

    def with_(self, **kw) -> "Params":
        return replace(self, **kw)

    def to_dict(self) -> dict:
        return asdict(self)


# --------------------------------------------------------------------------
# Cost models (per market). Prices are in quote units.
# --------------------------------------------------------------------------
@dataclass(frozen=True)
class CostModel:
    half_spread: float            # price units (half of bid/ask spread)
    slippage: float               # price units, applied to market/stop fills
    maker_fee: float              # fraction of notional per side (limit fills)
    taker_fee: float              # fraction of notional per side (market/stop)
    funding_8h: float = 0.0       # fraction of notional per 8 h (longs pay)
    spread_is_relative: bool = False  # if True half_spread/slippage are fractions of price

    def scaled(self, spread=1.0, slip=1.0, fees=1.0, funding=1.0) -> "CostModel":
        return replace(self, half_spread=self.half_spread * spread,
                       slippage=self.slippage * slip,
                       maker_fee=self.maker_fee * fees,
                       taker_fee=self.taker_fee * fees,
                       funding_8h=self.funding_8h * funding)

    def hs(self, price: float) -> float:
        return self.half_spread * price if self.spread_is_relative else self.half_spread

    def slip(self, price: float) -> float:
        return self.slippage * price if self.spread_is_relative else self.slippage


# Realistic retail/pro costs, fixed a priori (see STRATEGY_SPEC.md §15).
#  Crypto: Binance USDT-M perpetual, VIP0: maker 0.02%, taker 0.05%.
#          BTC spread ~0.1 USD on ~60k (negligible) -> model 0.5 bp half-spread
#          to cover quote drift; slippage on stops 1.5 bp (BTC) / 2.5 bp (ETH).
#          Funding: 0.01%/8h baseline (longs pay, shorts receive).
#  FX:     ECN raw-spread account, $7 per 100k round turn = 0.0035% / side.
#          Typical London/NY raw spreads (EURUSD 0.2 pip, GBPUSD 0.5 pip,
#          USDJPY 0.4 pip, XAUUSD 0.20 USD) plus stop slippage.
REALISTIC_COSTS: Dict[str, CostModel] = {
    "BTCUSDT": CostModel(half_spread=0.00005, slippage=0.00015, maker_fee=0.0002,
                         taker_fee=0.0005, funding_8h=0.0001, spread_is_relative=True),
    "ETHUSDT": CostModel(half_spread=0.000075, slippage=0.00025, maker_fee=0.0002,
                         taker_fee=0.0005, funding_8h=0.0001, spread_is_relative=True),
    "EURUSD": CostModel(half_spread=0.00001, slippage=0.00002, maker_fee=0.000035,
                        taker_fee=0.000035),
    "GBPUSD": CostModel(half_spread=0.000025, slippage=0.00003, maker_fee=0.000035,
                        taker_fee=0.000035),
    "USDJPY": CostModel(half_spread=0.002, slippage=0.003, maker_fee=0.000035,
                        taker_fee=0.000035),
    "XAUUSD": CostModel(half_spread=0.10, slippage=0.10, maker_fee=0.000035,
                        taker_fee=0.000035),
}

ZERO_COST = CostModel(0.0, 0.0, 0.0, 0.0, 0.0)

COST_SCENARIOS = {
    "zero": dict(zero=True),
    "realistic": dict(spread=1.0, slip=1.0, fees=1.0, funding=1.0),
    "plus25": dict(spread=1.25, slip=1.25, fees=1.25, funding=1.25),
    "plus50": dict(spread=1.5, slip=1.5, fees=1.5, funding=1.5),
    "slip_x3": dict(spread=1.0, slip=3.0, fees=1.0, funding=1.0),
    "adverse": dict(spread=2.0, slip=3.0, fees=1.5, funding=2.0),
}


def cost_for(market: str, scenario: str = "realistic") -> CostModel:
    spec = COST_SCENARIOS[scenario]
    base = REALISTIC_COSTS[market]
    if spec.get("zero"):
        return replace(ZERO_COST, spread_is_relative=base.spread_is_relative)
    return base.scaled(**spec)


CRYPTO = ("BTCUSDT", "ETHUSDT")
FOREX = ("EURUSD", "GBPUSD", "USDJPY", "XAUUSD")
MARKETS = CRYPTO + FOREX


def is_fx(market: str) -> bool:
    return market in FOREX
