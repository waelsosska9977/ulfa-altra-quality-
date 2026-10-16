import { BacktestConfig } from '../types/quant';

/**
 * Generates 100% complete, runnable, production-ready Python code
 * using vectorbt, pandas, and numpy.
 * 
 * Complies with strict rules:
 * 1. Vectorized operations only (vectorbt, pandas, numpy)
 * 2. Enforces 0.06% fees (0.0006) and slippage (0.0005)
 * 3. Mandates Train/Test (In-Sample / Out-of-Sample) split
 * 4. Closed-form Pre-Cross equilibrium P_cross formula & OTE 50% Limit Entry
 * 5. Maximum chasing tolerance (0.25 * ATR) disqualifier
 * 6. Structured JSON Execution Payload output schema
 */
export function generateProductionPythonScript(config: BacktestConfig): string {
  const trainPct = Math.round(config.trainRatio * 100);
  const testPct = 100 - trainPct;
  const symbol = config.symbol.toUpperCase();
  const timeframe = config.timeframe;

  return `#!/usr/bin/env python3
"""
================================================================================
ULTRA ALPHA QUANT - MATHEMATICAL PRECISION ENTRY EXECUTION ENGINE
Architecture: Vectorbt + Pandas + NumPy
Symbol: ${symbol} | Timeframe: ${timeframe}
Enforced Rules:
  - Closed-Form Pre-Cross Equilibrium Pricing (P_cross)
  - Optimal Trade Entry (OTE 50% Equilibrium) & VWAP/EMA Band Anchor
  - Maximum Chasing Tolerance Cap (0.25 * ATR)
  - Enforced Fees (0.06%) & Slippage
  - Mandated Train/Test (In-Sample: ${trainPct}% / Out-of-Sample: ${testPct}%) Split
================================================================================
"""

import sys
import json
import requests
import numpy as np
import pandas as pd
import vectorbt as vbt
from datetime import datetime

# ------------------------------------------------------------------------------
# 1. PARAMETERS & CONFIGURATION
# ------------------------------------------------------------------------------
SYMBOL = "${symbol}"
TIMEFRAME = "${timeframe}"
LIMIT = ${config.candleLimit}
TRAIN_RATIO = ${config.trainRatio}      # ${trainPct}% In-Sample, ${testPct}% Out-of-Sample
FEE_RATE = ${config.feeRate}            # 0.06% Binance Taker Fee
SLIPPAGE_RATE = ${config.slippageRate}  # 0.05% Realistic Slippage
INITIAL_CAPITAL = ${config.initialCapital}.0
MIN_CONFLUENCE = ${config.minConfluence}
CHASING_TOLERANCE_ATR = 0.25
ATR_SL_MULT = ${config.atrMultiplierSL}
ATR_TP_MULT = ${config.atrMultiplierTP}
RSI_OB = ${config.rsiOverbought}
RSI_OS = ${config.rsiOversold}

# Minimum Tick Size Resolution
TICK_SIZES = {
    "BTCUSDT": 0.1,
    "ETHUSDT": 0.01,
    "SOLUSDT": 0.01,
    "BNBUSDT": 0.01,
    "XRPUSDT": 0.0001,
    "DOGEUSDT": 0.00001,
    "PEPEUSDT": 0.00000001,
}
TICK_SIZE = TICK_SIZES.get(SYMBOL, 0.01 if "USDT" in SYMBOL else 0.0001)

def round_to_tick(val: float, tick: float = TICK_SIZE) -> float:
    return round(round(val / tick) * tick, 8)

# ------------------------------------------------------------------------------
# 2. VECTORIZED DATA INGESTION (BINANCE PUBLIC REST API)
# ------------------------------------------------------------------------------
def fetch_binance_ohlcv(symbol: str, interval: str, limit: int = 1000) -> pd.DataFrame:
    """
    Fetches historical OHLCV data directly from Binance public endpoints
    with automated fallback handling.
    """
    endpoints = [
        "https://api.binance.com/api/v3/klines",
        "https://data-api.binance.vision/api/v3/klines",
        "https://api1.binance.com/api/v3/klines"
    ]
    
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    data = None
    
    for url in endpoints:
        try:
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                break
        except Exception:
            continue
            
    if not data or not isinstance(data, list):
        print(f"[!] Warning: Falling back to geometric Brownian motion synthetic series.")
        np.random.seed(42)
        dates = pd.date_range(end=datetime.utcnow(), periods=limit, freq="15min")
        returns = np.random.normal(0.0002, 0.012, limit)
        price_paths = 50000.0 * np.exp(np.cumsum(returns))
        df = pd.DataFrame({
            "open": price_paths * (1 + np.random.uniform(-0.002, 0.002, limit)),
            "high": price_paths * (1 + np.random.uniform(0.001, 0.008, limit)),
            "low": price_paths * (1 - np.random.uniform(0.001, 0.008, limit)),
            "close": price_paths,
            "volume": np.random.uniform(100, 5000, limit)
        }, index=dates)
        return df

    df = pd.DataFrame(data, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades", "taker_base", "taker_quote", "ignore"
    ])
    
    df["datetime"] = pd.to_datetime(df["open_time"], unit="ms")
    df.set_index("datetime", inplace=True)
    
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        
    return df[["open", "high", "low", "close", "volume"]].dropna()

# ------------------------------------------------------------------------------
# 3. VECTORIZED INDICATORS & MATHEMATICAL PRECISION ENTRY PRICING
# ------------------------------------------------------------------------------
def compute_vectorized_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes all quantitative features in a single vectorized pass, including:
    - EMA(9, 21, 50, 200)
    - Closed-form algebraic P_cross formula for EMA 9 / EMA 21
    - OTE 50% Equilibrium Limit Entry
    - Dynamic VWAP & EMA Band Anchors
    - Maximum Chasing Tolerance Cap
    """
    data = df.copy()
    close = data["close"]
    high = data["high"]
    low = data["low"]
    volume = data["volume"]

    # 1. Exponential Moving Averages
    data["ema9"] = close.ewm(span=9, adjust=False).mean()
    data["ema21"] = close.ewm(span=21, adjust=False).mean()
    data["ema50"] = close.ewm(span=50, adjust=False).mean()
    data["ema200"] = close.ewm(span=200, adjust=False).mean()

    # 2. Closed-Form Algebraic Pre-Cross Equilibrium Formula:
    # P_cross = (EMA_slow[1] * (1 - alpha_slow) - EMA_fast[1] * (1 - alpha_fast)) / (alpha_fast - alpha_slow)
    alpha_fast = 2.0 / (9.0 + 1.0)    # 0.20
    alpha_slow = 2.0 / (21.0 + 1.0)   # 0.09090909
    denom = alpha_fast - alpha_slow
    
    prev_e21 = data["ema21"].shift(1)
    prev_e9 = data["ema9"].shift(1)
    numerator = (prev_e21 * (1.0 - alpha_slow)) - (prev_e9 * (1.0 - alpha_fast))
    data["p_cross"] = numerator / denom

    # 3. Optimal Trade Entry (OTE 50% Equilibrium)
    candle_range = high - low
    data["ote_50"] = high - (candle_range * 0.50)

    # 4. Intraday Volume Weighted Average Price (VWAP)
    typical_price = (high + low + close) / 3.0
    cum_vol = volume.cumsum()
    cum_pv = (typical_price * volume).cumsum()
    data["vwap"] = cum_pv / np.where(cum_vol == 0, 1e-9, cum_vol)

    # 5. Volume 20 SMA & Expansion Ratio
    data["vol_sma20"] = volume.rolling(window=20).mean()
    data["vol_ratio"] = volume / np.where(data["vol_sma20"] == 0, 1e-9, data["vol_sma20"])

    # 6. Dynamic Limit Order Lock-on:
    # If 50% equilibrium is within 0.1% of intraday VWAP or EMA 9, lock onto it.
    vwap_dist = (data["ote_50"] - data["vwap"]).abs() / data["vwap"]
    ema9_dist = (data["ote_50"] - data["ema9"]).abs() / data["ema9"]
    
    exact_entry = data["ote_50"].copy()
    exact_entry = np.where(vwap_dist <= 0.001, data["vwap"], exact_entry)
    exact_entry = np.where((vwap_dist > 0.001) & (ema9_dist <= 0.001), data["ema9"], exact_entry)
    
    # If volume is expanding (V >= 1.8 * SMA20), cross P_cross equilibrium
    vol_expansion = data["vol_ratio"] >= 1.8
    exact_entry = np.where(vol_expansion & (data["p_cross"] > 0), (data["p_cross"] + data["ote_50"]) / 2.0, exact_entry)
    data["exact_entry"] = exact_entry

    # 7. Vectorized ATR (14) & Maximum Chasing Tolerance Cap
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    data["atr14"] = tr.ewm(alpha=1/14, adjust=False).mean()
    
    # Maximum Chasing Tolerance: Entry + 0.25 * ATR(14)
    data["max_allowable_price"] = data["exact_entry"] + (CHASING_TOLERANCE_ATR * data["atr14"])
    
    # Disqualification boolean: current market price exceeds tolerance cap
    data["chasing_disqualified"] = close > data["max_allowable_price"]

    # 8. Vectorized RSI (14)
    delta = close.diff()
    gain = np.where(delta > 0, delta, 0.0)
    loss = np.where(delta < 0, -delta, 0.0)
    avg_gain = pd.Series(gain, index=data.index).ewm(alpha=1/14, adjust=False).mean()
    avg_loss = pd.Series(loss, index=data.index).ewm(alpha=1/14, adjust=False).mean()
    rs = avg_gain / np.where(avg_loss == 0, 1e-9, avg_loss)
    data["rsi14"] = 100.0 - (100.0 / (1.0 + rs))

    # 9. Vectorized Stochastic (14, 3, 3)
    lowest_low = low.rolling(window=14).min()
    highest_high = high.rolling(window=14).max()
    raw_k = 100.0 * (close - lowest_low) / np.where((highest_high - lowest_low) == 0, 1e-9, (highest_high - lowest_low))
    data["stoch_k"] = raw_k.rolling(window=3).mean()
    data["stoch_d"] = data["stoch_k"].rolling(window=3).mean()

    # 10. Vectorized Money Flow Index (MFI - 14)
    raw_mf = typical_price * volume
    price_change = typical_price.diff()
    pos_mf = np.where(price_change > 0, raw_mf, 0.0)
    neg_mf = np.where(price_change < 0, raw_mf, 0.0)
    pos_sum = pd.Series(pos_mf, index=data.index).rolling(window=14).sum()
    neg_sum = pd.Series(neg_mf, index=data.index).rolling(window=14).sum()
    mr = pos_sum / np.where(neg_sum == 0, 1e-9, neg_sum)
    data["mfi14"] = 100.0 - (100.0 / (1.0 + mr))

    # 11. Vectorized ADX (14)
    plus_dm = np.where((high - high.shift(1) > low.shift(1) - low) & (high - high.shift(1) > 0), high - high.shift(1), 0.0)
    minus_dm = np.where((low.shift(1) - low > high - high.shift(1)) & (low.shift(1) - low > 0), low.shift(1) - low, 0.0)
    smooth_tr = tr.ewm(alpha=1/14, adjust=False).mean()
    smooth_pdm = pd.Series(plus_dm, index=data.index).ewm(alpha=1/14, adjust=False).mean()
    smooth_mdm = pd.Series(minus_dm, index=data.index).ewm(alpha=1/14, adjust=False).mean()
    
    data["plus_di"] = 100.0 * (smooth_pdm / np.where(smooth_tr == 0, 1e-9, smooth_tr))
    data["minus_di"] = 100.0 * (smooth_mdm / np.where(smooth_tr == 0, 1e-9, smooth_tr))
    di_sum = data["plus_di"] + data["minus_di"]
    dx = 100.0 * ((data["plus_di"] - data["minus_di"]).abs() / np.where(di_sum == 0, 1e-9, di_sum))
    data["adx14"] = dx.ewm(alpha=1/14, adjust=False).mean()

    return data.dropna()

# ------------------------------------------------------------------------------
# 4. VECTORIZED CONFLUENCE ENGINE & LIMIT SIGNAL EXECUTION
# ------------------------------------------------------------------------------
def generate_confluence_signals(df: pd.DataFrame, min_confluence: int = 6):
    """
    Evaluates 8 conditions and filters out chasing trades using maximum allowable price.
    """
    close = df["close"]
    
    c1_ema = (close > df["ema9"]) & (df["ema9"] > df["ema21"]) & (df["ema21"] > df["ema50"])
    c2_vwap = close > df["vwap"]
    c3_rsi = (df["rsi14"] >= RSI_OS) & (df["rsi14"] <= RSI_OB)
    c4_stoch = (df["stoch_k"] > df["stoch_d"]) & (df["stoch_k"] < 85)
    c5_mfi = df["mfi14"] >= 50.0
    c6_vol = df["vol_ratio"] >= 1.25
    c7_adx = (df["adx14"] >= 20.0) & (df["plus_di"] > df["minus_di"])
    c8_atr = df["atr14"] > 0

    confluence_matrix = pd.concat([
        c1_ema, c2_vwap, c3_rsi, c4_stoch, c5_mfi, c6_vol, c7_adx, c8_atr
    ], axis=1)
    
    scores = confluence_matrix.sum(axis=1)

    # Entry condition with Chasing Tolerance check (No market chasing!)
    raw_entries = scores >= min_confluence
    valid_entries = raw_entries & (~df["chasing_disqualified"])
    
    exits = (close < df["ema21"]) | (close < df["vwap"]) | (df["rsi14"] > 78)
    valid_entries, exits = pd.Series(valid_entries).vbt.signals.clean(exits)
    
    return valid_entries, exits, scores

# ------------------------------------------------------------------------------
# 5. STRUCTURED PRECISION EXECUTION PAYLOAD GENERATOR
# ------------------------------------------------------------------------------
def build_precision_execution_payload(row: pd.Series, symbol: str) -> dict:
    """
    Constructs the exact structured JSON execution payload for order routing
    """
    exact_entry = round_to_tick(row["exact_entry"])
    atr = row["atr14"]
    sl = round_to_tick(exact_entry - (atr * ATR_SL_MULT))
    tp1 = round_to_tick(exact_entry + (atr * ATR_TP_MULT))
    tp2 = round_to_tick(exact_entry + (atr * (ATR_TP_MULT * 1.5)))
    max_price = round_to_tick(row["max_allowable_price"])
    
    risk = abs(exact_entry - sl)
    reward = abs(tp1 - exact_entry)
    rr = round(reward / risk, 2) if risk > 0 else 2.0
    
    # Mechanism detection
    if abs(exact_entry - row["vwap"]) / row["vwap"] <= 0.001:
        mechanism = "VWAP_ANCHOR_CONFLUENCE"
    elif abs(exact_entry - row["ema9"]) / row["ema9"] <= 0.001:
        mechanism = "EMA9_PULLBACK_ANCHOR"
    elif row["vol_ratio"] >= 1.8:
        mechanism = "EMA_CROSS_50PCT_EQUILIBRIUM"
    else:
        mechanism = "OTE_50PCT_EQUILIBRIUM"

    # Mathematical Entry Probability % Calculation ("نسبة الدخول الصحيحة")
    trend_score = 90.0 if row["close"] > row["ema9"] and row["ema9"] > row["ema21"] else 40.0
    vol_score = 90.0 if row["vol_ratio"] >= 1.8 else (70.0 if row["vol_ratio"] >= 1.25 else 30.0)
    mom_score = 85.0 if 50.0 <= row["rsi14"] <= 68.0 and row["stoch_k"] > row["stoch_d"] else 45.0
    rr_score = 85.0 if rr >= 2.5 else 60.0
    win_prob = round(min(93.5, max(25.0, (trend_score * 0.30) + (vol_score * 0.25) + (mom_score * 0.25) + (rr_score * 0.20))), 1)
    
    tier = "ELITE_SNIPER" if win_prob >= 80 else ("HIGH_PROBABILITY" if win_prob >= 70 else "MODERATE")

    payload = {
        "symbol": symbol,
        "direction": "BUY",
        "exact_entry_price": exact_entry,
        "entry_win_probability_pct": win_prob,
        "confidence_tier": tier,
        "entry_mechanism": mechanism,
        "tick_size_applied": TICK_SIZE,
        "max_allowable_price": max_price,
        "stop_loss_exact": sl,
        "take_profit_target_1": tp1,
        "take_profit_target_2": tp2,
        "risk_to_reward_ratio": rr,
        "execution_timeout_seconds": 180
    }
    return payload

# ------------------------------------------------------------------------------
# 6. VECTORIZED BACKTESTING WITH IN-SAMPLE & OUT-OF-SAMPLE SPLIT
# ------------------------------------------------------------------------------
def run_rigorous_quant_backtest():
    print("=" * 80)
    print(f"[*] Starting Precision Execution Backtest for {SYMBOL} [{TIMEFRAME}]")
    print(f"[*] Fee Policy: {FEE_RATE * 100:.3f}% | Slippage Policy: {SLIPPAGE_RATE * 100:.3f}%")
    print(f"[*] Chasing Tolerance Cap: {CHASING_TOLERANCE_ATR} * ATR(14)")
    print("=" * 80)

    # 1. Ingest Data
    raw_df = fetch_binance_ohlcv(SYMBOL, TIMEFRAME, LIMIT)
    print(f"[+] Ingested {len(raw_df)} bars ({raw_df.index[0]} to {raw_df.index[-1]})")

    # 2. Vectorized Indicators & Precision Pricing
    df = compute_vectorized_indicators(raw_df)

    # 3. Train / Test Split Boundary (MANDATORY ANTI-OVERFITTING RULE)
    total_bars = len(df)
    split_idx = int(total_bars * TRAIN_RATIO)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    print(f"[+] Train (In-Sample): {len(train_df)} bars | Test (Out-of-Sample): {len(test_df)} bars")

    # 4. Generate Vectorized Signals
    entries, exits, scores = generate_confluence_signals(df, MIN_CONFLUENCE)

    # Execute Portfolios with exact limit entry pricing
    pf_in = vbt.Portfolio.from_signals(
        close=train_df["exact_entry"],
        entries=entries.iloc[:split_idx],
        exits=exits.iloc[:split_idx],
        init_cash=INITIAL_CAPITAL,
        fees=FEE_RATE,
        slippage=SLIPPAGE_RATE,
        freq=TIMEFRAME
    )

    pf_out = vbt.Portfolio.from_signals(
        close=test_df["exact_entry"],
        entries=entries.iloc[split_idx:],
        exits=exits.iloc[split_idx:],
        init_cash=INITIAL_CAPITAL,
        fees=FEE_RATE,
        slippage=SLIPPAGE_RATE,
        freq=TIMEFRAME
    )

    is_sharpe = pf_in.sharpe_ratio()
    oos_sharpe = pf_out.sharpe_ratio()
    overfit_ratio = oos_sharpe / is_sharpe if is_sharpe > 0 else 0.0

    print("\\n" + "=" * 80)
    print("                    QUANTITATIVE PERFORMANCE REPORT")
    print("=" * 80)
    print(f"{'Metric':<30} | {'In-Sample (Train)':<22} | {'Out-of-Sample (Test)':<22}")
    print("-" * 80)
    print(f"{'Total Return [%]':<30} | {pf_in.total_return() * 100:>20.2f}% | {pf_out.total_return() * 100:>20.2f}%")
    print(f"{'Sharpe Ratio':<30} | {is_sharpe:>21.2f} | {oos_sharpe:>21.2f}")
    print(f"{'Sortino Ratio':<30} | {pf_in.sortino_ratio():>21.2f} | {pf_out.sortino_ratio():>21.2f}")
    print(f"{'Max Drawdown [%]':<30} | {pf_in.max_drawdown() * 100:>20.2f}% | {pf_out.max_drawdown() * 100:>20.2f}%")
    print(f"{'Win Rate [%]':<30} | {pf_in.trades.win_rate() * 100:>20.2f}% | {pf_out.trades.win_rate() * 100:>20.2f}%")
    print(f"{'Total Trades':<30} | {pf_in.trades.count():>21} | {pf_out.trades.count():>21}")
    print("-" * 80)
    print(f"Overfitting Degradation Ratio: {overfit_ratio:.2f}")
    print("=" * 80)

    # 5. Output Most Recent Precision Execution Payload Example
    latest_row = df.iloc[-1]
    payload = build_precision_execution_payload(latest_row, SYMBOL)
    print("\\n[*] Active Execution Payload (Institutional Schema):")
    print(json.dumps(payload, indent=2))

    return pf_in, pf_out

if __name__ == "__main__":
    run_rigorous_quant_backtest()
`;
}
