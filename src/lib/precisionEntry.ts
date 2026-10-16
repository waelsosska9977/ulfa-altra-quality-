import { Candle, PrecisionEntryPayload, EntryMechanism, ExecutionStatus } from '../types/quant';

/**
 * Exchange Minimum Tick-Size Resolution
 * Strictly rounds prices to valid Binance order-book price increments
 */
export function getExchangeTickSize(symbol: string, price: number): number {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (sym.includes('BTC')) return 0.1;
  if (sym.includes('ETH')) return 0.01;
  if (sym.includes('SOL') || sym.includes('BNB') || sym.includes('AVAX') || sym.includes('LINK')) return 0.01;
  if (sym.includes('PEPE') || sym.includes('SHIB') || sym.includes('BONK') || sym.includes('FLOKI')) return 0.00000001;
  if (price > 1000) return 0.1;
  if (price > 10) return 0.01;
  if (price > 0.1) return 0.0001;
  return 0.000001;
}

/**
 * Precision Tick-Size Rounding (eliminates floating-point imprecision)
 */
export function roundToTick(value: number, tickSize: number): number {
  if (tickSize <= 0) return value;
  const factor = 1 / tickSize;
  return Math.round(value * factor) / factor;
}

/**
 * 1. Closed-Form Algebraic Real-Time Moving Average Intersection Pricing (Pre-Cross Equilibrium)
 * 
 * Formula:
 * P_cross = (EMA_slow[1] * (1 - alpha_slow) - EMA_fast[1] * (1 - alpha_fast)) / (alpha_fast - alpha_slow)
 * where alpha = 2 / (N + 1)
 */
export function calculatePreCrossPrice(
  prevEmaFast: number,
  prevEmaSlow: number,
  fastPeriod: number = 9,
  slowPeriod: number = 21
): number {
  const alphaFast = 2 / (fastPeriod + 1);
  const alphaSlow = 2 / (slowPeriod + 1);
  const denom = alphaFast - alphaSlow;
  if (Math.abs(denom) < 1e-9) return prevEmaFast;

  const numerator = (prevEmaSlow * (1 - alphaSlow)) - (prevEmaFast * (1 - alphaFast));
  return numerator / denom;
}

export interface PrecisionCalculationInputs {
  symbol: string;
  currentPrice: number;
  currentCandle: Candle;
  prevCandle?: Candle;
  prevEma9: number;
  prevEma21: number;
  currentEma9: number;
  currentVwap: number;
  currentAtr: number;
  currentVolume: number;
  currentVolSma20: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
}

/**
 * Computes Mathematical Precision Entry Order conforming strictly to
 * the 4 Institutional Precision Execution Rules.
 */
export function calculatePrecisionEntry(inputs: PrecisionCalculationInputs): PrecisionEntryPayload {
  const {
    symbol,
    currentPrice,
    currentCandle,
    prevEma9,
    prevEma21,
    currentEma9,
    currentVwap,
    currentAtr,
    currentVolume,
    currentVolSma20,
    direction
  } = inputs;

  const isBuy = direction === 'LONG' || direction === 'NEUTRAL';
  const orderDirection: 'BUY' | 'SELL' = isBuy ? 'BUY' : 'SELL';
  const tickSize = getExchangeTickSize(symbol, currentPrice);

  // 1. Calculate Closed-Form Algebraic Pre-Cross Equilibrium Price
  const pCrossRaw = calculatePreCrossPrice(prevEma9, prevEma21, 9, 21);
  const isVolumeExpanding = currentVolSma20 > 0 && (currentVolume >= 1.8 * currentVolSma20);

  // 2. Institutional Pullback Limit Order (Optimal Trade Entry - 50% Equilibrium)
  const high = currentCandle.high;
  const low = currentCandle.low;
  const candleRange = high - low;

  let ote50Raw = isBuy
    ? high - (candleRange * 0.50)
    : low + (candleRange * 0.50);

  // Fallback if candle range is zero
  if (candleRange <= 0) {
    ote50Raw = currentPrice;
  }

  // 3. Dynamic VWAP / EMA Band Anchor Confluence:
  // If the 50% equilibrium level is within 0.1% (0.001) of intraday VWAP or EMA 9,
  // lock Limit Entry price exactly onto the EMA 9 / VWAP value.
  let exactEntryRaw = ote50Raw;
  let entryMechanism: EntryMechanism = 'OTE_50PCT_EQUILIBRIUM';

  const vwapDistPct = Math.abs(ote50Raw - currentVwap) / (currentVwap || 1);
  const ema9DistPct = Math.abs(ote50Raw - currentEma9) / (currentEma9 || 1);

  if (vwapDistPct <= 0.001) {
    exactEntryRaw = currentVwap;
    entryMechanism = 'VWAP_ANCHOR_CONFLUENCE';
  } else if (ema9DistPct <= 0.001) {
    exactEntryRaw = currentEma9;
    entryMechanism = 'EMA9_PULLBACK_ANCHOR';
  } else if (isVolumeExpanding && pCrossRaw > 0 && Math.abs(currentPrice - pCrossRaw) / currentPrice < 0.015) {
    // If volume is expanding (V >= 1.8 * SMA20) and crossing P_cross equilibrium
    exactEntryRaw = (pCrossRaw + ote50Raw) / 2;
    entryMechanism = 'EMA_CROSS_50PCT_EQUILIBRIUM';
  } else if (isVolumeExpanding && pCrossRaw > 0) {
    exactEntryRaw = pCrossRaw;
    entryMechanism = 'EMA_PRE_CROSS_EQUILIBRIUM';
  }

  // Round calculated entry to minimum exchange tick size
  const exactEntryPrice = roundToTick(exactEntryRaw, tickSize);
  const pCrossPrice = roundToTick(pCrossRaw, tickSize);

  // 4. Strict Entry Filters & Tolerance Window
  // Slippage Cap / Max Chasing Tolerance: Never enter if current market price
  // has moved more than 0.25 * ATR(14) away from calculated entry level.
  const chasingToleranceAtr = 0.25;
  const maxChasingDistance = currentAtr * chasingToleranceAtr;

  const maxAllowablePriceRaw = isBuy
    ? exactEntryPrice + maxChasingDistance
    : exactEntryPrice - maxChasingDistance;

  const maxAllowablePrice = roundToTick(maxAllowablePriceRaw, tickSize);

  // Compute current distance from entry in units of ATR
  const currentDistanceAtr = currentAtr > 0
    ? Math.abs(currentPrice - exactEntryPrice) / currentAtr
    : 0;

  // Disqualification check: if current market price has run away past the tolerance window
  const isChasingDisqualified = isBuy
    ? currentPrice > maxAllowablePrice
    : currentPrice < maxAllowablePrice;

  const executionStatus: ExecutionStatus = isChasingDisqualified
    ? 'EXPIRED_CHASING_DISQUALIFIED'
    : 'ACTIVE_LIMIT_ORDER';

  // 5. High-Precision Stop Loss & Multi-Tier Take Profits (Asymmetric RR)
  const atrSLMultiplier = 1.5;
  const atrTP1Multiplier = 2.5;
  const atrTP2Multiplier = 4.2;

  let stopLossExactRaw: number;
  let tp1Raw: number;
  let tp2Raw: number;

  if (isBuy) {
    stopLossExactRaw = exactEntryPrice - (currentAtr * atrSLMultiplier);
    tp1Raw = exactEntryPrice + (currentAtr * atrTP1Multiplier);
    tp2Raw = exactEntryPrice + (currentAtr * atrTP2Multiplier);
  } else {
    stopLossExactRaw = exactEntryPrice + (currentAtr * atrSLMultiplier);
    tp1Raw = exactEntryPrice - (currentAtr * atrTP1Multiplier);
    tp2Raw = exactEntryPrice - (currentAtr * atrTP2Multiplier);
  }

  const stopLossExact = roundToTick(stopLossExactRaw, tickSize);
  const takeProfit1 = roundToTick(tp1Raw, tickSize);
  const takeProfit2 = roundToTick(tp2Raw, tickSize);

  const risk = Math.abs(exactEntryPrice - stopLossExact);
  const reward = Math.abs(takeProfit1 - exactEntryPrice);
  const riskToRewardRatio = risk > 0 ? +(reward / risk).toFixed(2) : 2.0;

  return {
    symbol,
    direction: orderDirection,
    exact_entry_price: exactEntryPrice,
    entry_mechanism: entryMechanism,
    tick_size_applied: tickSize,
    max_allowable_price: maxAllowablePrice,
    stop_loss_exact: stopLossExact,
    take_profit_target_1: takeProfit1,
    take_profit_target_2: takeProfit2,
    risk_to_reward_ratio: riskToRewardRatio,
    execution_timeout_seconds: 180,
    order_type: 'LIMIT',
    execution_status: executionStatus,
    p_cross_price: pCrossPrice,
    chasing_tolerance_atr: chasingToleranceAtr,
    current_distance_atr: +currentDistanceAtr.toFixed(2),
  };
}
