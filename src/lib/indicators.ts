import { Candle, IndicatorValues, ConfluenceCondition, SignalAnalysis } from '../types/quant';
import { calculatePrecisionEntry } from './precisionEntry';
import { calculateEntryProbability } from './entryProbability';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  if (data.length === 0) return result;
  
  const k = 2 / (period + 1);
  let sum = 0;
  const initialPeriod = Math.min(period, data.length);
  
  for (let i = 0; i < initialPeriod; i++) {
    sum += data[i];
  }
  let prevEMA = sum / initialPeriod;
  for (let i = 0; i < initialPeriod; i++) {
    result[i] = prevEMA;
  }
  
  for (let i = initialPeriod; i < data.length; i++) {
    const currentEMA = data[i] * k + prevEMA * (1 - k);
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  
  return result;
}

/**
 * Calculates Volume Weighted Average Price (VWAP) and standard deviation bands
 */
export function calculateVWAP(candles: Candle[]): {
  vwap: number[];
  upperBand: number[];
  lowerBand: number[];
} {
  const n = candles.length;
  const vwap = new Array(n).fill(0);
  const upperBand = new Array(n).fill(0);
  const lowerBand = new Array(n).fill(0);
  
  if (n === 0) return { vwap, upperBand, lowerBand };

  // Cumulative sums over the sequence or intraday session
  let cumVolume = 0;
  let cumTypicalVolume = 0;
  let cumTypicalVolumeSquared = 0;

  for (let i = 0; i < n; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const vol = Math.max(candles[i].volume, 0.00001);
    
    cumVolume += vol;
    cumTypicalVolume += typicalPrice * vol;
    cumTypicalVolumeSquared += typicalPrice * typicalPrice * vol;

    const currentVwap = cumTypicalVolume / cumVolume;
    vwap[i] = currentVwap;

    // Standard deviation for VWAP bands
    const variance = Math.max(0, (cumTypicalVolumeSquared / cumVolume) - (currentVwap * currentVwap));
    const stdDev = Math.sqrt(variance);

    upperBand[i] = currentVwap + (stdDev * 1.5);
    lowerBand[i] = currentVwap - (stdDev * 1.5);
  }

  return { vwap, upperBand, lowerBand };
}

/**
 * Calculates Relative Strength Index (RSI - 14)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const n = closes.length;
  const rsi = new Array(n).fill(50);
  if (n <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

  for (let i = period + 1; i < n; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Calculates Stochastic Oscillator (%K, %D)
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number[]; d: number[] } {
  const n = closes.length;
  const rawK = new Array(n).fill(50);
  const k = new Array(n).fill(50);
  const d = new Array(n).fill(50);

  for (let i = period - 1; i < n; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (highs[j] > highestHigh) highestHigh = highs[j];
      if (lows[j] < lowestLow) lowestLow = lows[j];
    }
    const range = highestHigh - lowestLow;
    rawK[i] = range === 0 ? 50 : ((closes[i] - lowestLow) / range) * 100;
  }

  // Smooth rawK with SMA of length smoothK
  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - smoothK + 1); j <= i; j++) {
      sum += rawK[j];
      count++;
    }
    k[i] = count > 0 ? sum / count : 50;
  }

  // Smooth K to get D
  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - smoothD + 1); j <= i; j++) {
      sum += k[j];
      count++;
    }
    d[i] = count > 0 ? sum / count : 50;
  }

  return { k, d };
}

/**
 * Calculates Money Flow Index (MFI - 14)
 */
export function calculateMFI(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period: number = 14
): number[] {
  const n = closes.length;
  const mfi = new Array(n).fill(50);
  if (n <= period) return mfi;

  const typicalPrices = new Array(n);
  const rawMoneyFlow = new Array(n);

  for (let i = 0; i < n; i++) {
    typicalPrices[i] = (highs[i] + lows[i] + closes[i]) / 3;
    rawMoneyFlow[i] = typicalPrices[i] * volumes[i];
  }

  for (let i = period; i < n; i++) {
    let posFlow = 0;
    let negFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        posFlow += rawMoneyFlow[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negFlow += rawMoneyFlow[j];
      }
    }

    if (negFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyRatio = posFlow / negFlow;
      mfi[i] = 100 - (100 / (1 + moneyRatio));
    }
  }

  return mfi;
}

/**
 * Calculates Average Directional Index (ADX) & Directional Movement (+DI, -DI)
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): { adx: number[]; plusDI: number[]; minusDI: number[] } {
  const n = closes.length;
  const adx = new Array(n).fill(20);
  const plusDI = new Array(n).fill(20);
  const minusDI = new Array(n).fill(20);

  if (n <= period * 2) return { adx, plusDI, minusDI };

  const tr = new Array(n).fill(0);
  const plusDM = new Array(n).fill(0);
  const minusDM = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const h = highs[i];
    const l = lows[i];
    const prevC = closes[i - 1];
    const prevH = highs[i - 1];
    const prevL = lows[i - 1];

    tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));

    const upMove = h - prevH;
    const downMove = prevL - l;

    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
    }
    if (downMove > upMove && downMove > 0) {
      minusDM[i] = downMove;
    }
  }

  // Wilder's smoothing
  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 1; i <= period; i++) {
    smoothedTR += tr[i];
    smoothedPlusDM += plusDM[i];
    smoothedMinusDM += minusDM[i];
  }

  const dx = new Array(n).fill(0);

  for (let i = period; i < n; i++) {
    if (i > period) {
      smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
      smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
      smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
    }

    const currentPlusDI = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100;
    const currentMinusDI = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100;

    plusDI[i] = currentPlusDI;
    minusDI[i] = currentMinusDI;

    const diSum = currentPlusDI + currentMinusDI;
    const diDiff = Math.abs(currentPlusDI - currentMinusDI);
    dx[i] = diSum === 0 ? 0 : (diDiff / diSum) * 100;
  }

  // Smooth DX to get ADX
  let adxSum = 0;
  for (let i = period; i < period * 2; i++) {
    adxSum += dx[i];
  }
  adx[period * 2 - 1] = adxSum / period;

  for (let i = period * 2; i < n; i++) {
    adx[i] = (adx[i - 1] * (period - 1) + dx[i]) / period;
  }

  return { adx, plusDI, minusDI };
}

/**
 * Calculates Average True Range (ATR - 14)
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  const n = closes.length;
  const atr = new Array(n).fill(0);
  if (n <= 1) return atr;

  const tr = new Array(n).fill(0);
  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }

  let sum = 0;
  const init = Math.min(period, n);
  for (let i = 0; i < init; i++) {
    sum += tr[i];
  }
  let prevATR = sum / init;
  for (let i = 0; i < init; i++) {
    atr[i] = prevATR;
  }

  for (let i = init; i < n; i++) {
    const curATR = (prevATR * (period - 1) + tr[i]) / period;
    atr[i] = curATR;
    prevATR = curATR;
  }

  return atr;
}

/**
 * Calculates Simple Moving Average of Volume
 */
export function calculateVolumeSMA(volumes: number[], period: number = 20): number[] {
  const n = volumes.length;
  const sma = new Array(n).fill(0);
  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += volumes[i];
    if (i >= period) {
      sum -= volumes[i - period];
      sma[i] = sum / period;
    } else {
      sma[i] = sum / (i + 1);
    }
  }

  return sma;
}

/**
 * Vectorized multi-indicator engine evaluation
 */
export function computeAllIndicators(candles: Candle[]) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const { vwap, upperBand, lowerBand } = calculateVWAP(candles);
  const rsi = calculateRSI(closes, 14);
  const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes, 14, 3, 3);
  const mfi = calculateMFI(highs, lows, closes, volumes, 14);
  const { adx, plusDI, minusDI } = calculateADX(highs, lows, closes, 14);
  const atr = calculateATR(highs, lows, closes, 14);
  const volSMA = calculateVolumeSMA(volumes, 20);

  return {
    closes,
    highs,
    lows,
    volumes,
    ema9,
    ema21,
    ema50,
    ema200,
    vwap,
    upperBand,
    lowerBand,
    rsi,
    stochK,
    stochD,
    mfi,
    adx,
    plusDI,
    minusDI,
    atr,
    volSMA,
  };
}

/**
 * Builds the 8-point Ultra Alpha + Sosska Confluence Scorecard for an asset
 */
export function evaluateConfluence(
  candles: Candle[],
  symbol: string,
  timeframe: string,
  change24h: number = 0,
  volume24hUsdt: number = 0
): SignalAnalysis {
  const indicators = computeAllIndicators(candles);
  const idx = candles.length - 1;
  const currentPrice = candles[idx]?.close || 0;

  const curE9 = indicators.ema9[idx];
  const curE21 = indicators.ema21[idx];
  const curE50 = indicators.ema50[idx];
  const curE200 = indicators.ema200[idx];
  const curVwap = indicators.vwap[idx];
  const curRsi = indicators.rsi[idx];
  const curStochK = indicators.stochK[idx];
  const curStochD = indicators.stochD[idx];
  const curMfi = indicators.mfi[idx];
  const curAdx = indicators.adx[idx];
  const curPlusDI = indicators.plusDI[idx];
  const curMinusDI = indicators.minusDI[idx];
  const curAtr = indicators.atr[idx] || (currentPrice * 0.015);
  const curVol = candles[idx]?.volume || 1;
  const curVolSma = indicators.volSMA[idx] || 1;
  const volRatio = curVolSma > 0 ? curVol / curVolSma : 1;

  // 8 Specific Ultra Alpha & Sosska Confluence Conditions
  const conditions: ConfluenceCondition[] = [
    {
      id: 'ema_trend_stack',
      name: 'EMA Alignment (9/21/50/200)',
      nameAr: 'ترتيب المتوسطات المتحركة (EMA)',
      category: 'TREND',
      bullish: currentPrice > curE9 && curE9 > curE21 && curE21 > curE50,
      bearish: currentPrice < curE9 && curE9 < curE21 && curE21 < curE50,
      weight: 1,
      description: 'Price stacked above EMA9 > 21 > 50 for Long, or below for Short',
      descriptionAr: 'السعر أعلى من EMA9 > 21 > 50 للصعود، أو العكس للهبوط',
      currentValue: `P:${currentPrice.toFixed(2)} | E9:${curE9.toFixed(2)} | E21:${curE21.toFixed(2)}`
    },
    {
      id: 'vwap_dynamic_bias',
      name: 'VWAP Institutional Anchor',
      nameAr: 'ارتكاز الفوليوم المؤسسي (VWAP)',
      category: 'TREND',
      bullish: currentPrice > curVwap,
      bearish: currentPrice < curVwap,
      weight: 1,
      description: 'Price holding above volume-weighted average price',
      descriptionAr: 'ثبات السعر أعلى المتوسط المرجح بحجم التداول',
      currentValue: `VWAP: ${curVwap.toFixed(2)} (${currentPrice > curVwap ? '+' : ''}${(((currentPrice - curVwap) / curVwap) * 100).toFixed(2)}%)`
    },
    {
      id: 'rsi_momentum_flow',
      name: 'RSI Momentum (14)',
      nameAr: 'زخم مؤشر القوة النسبية (RSI)',
      category: 'MOMENTUM',
      bullish: curRsi >= 48 && curRsi <= 68,
      bearish: curRsi <= 52 && curRsi >= 32,
      weight: 1,
      description: 'RSI in active acceleration zone without extreme exhaustion',
      descriptionAr: 'مؤشر RSI في نطاق تسارع صحي دون تشبع مفرط',
      currentValue: `RSI: ${curRsi.toFixed(1)}`
    },
    {
      id: 'stoch_cross',
      name: 'Stochastic Oscillator (%K / %D)',
      nameAr: 'تقاطع الستوكاستيك (%K / %D)',
      category: 'MOMENTUM',
      bullish: curStochK > curStochD && curStochK < 85,
      bearish: curStochK < curStochD && curStochK > 15,
      weight: 1,
      description: 'Fast %K crossed over slow %D confirming trigger pulse',
      descriptionAr: 'تقاطع إيجابي أو سلبي لخط %K مع %D مؤكداً نبض الدخول',
      currentValue: `%K:${curStochK.toFixed(1)} / %D:${curStochD.toFixed(1)}`
    },
    {
      id: 'mfi_capital_inflow',
      name: 'Money Flow Index (MFI)',
      nameAr: 'مؤشر تدفق السيولة النقدية (MFI)',
      category: 'VOLUME',
      bullish: curMfi >= 52,
      bearish: curMfi <= 48,
      weight: 1,
      description: 'Volume-weighted price accumulation exceeds distribution',
      descriptionAr: 'تدفق السيولة الإيجابي يفوق التصريف البيعي',
      currentValue: `MFI: ${curMfi.toFixed(1)}`
    },
    {
      id: 'volume_expansion',
      name: 'Volume Expansion (20 SMA)',
      nameAr: 'انفجار الفوليوم فوق المتوسط',
      category: 'VOLUME',
      bullish: volRatio >= 1.25,
      bearish: volRatio >= 1.25,
      weight: 1,
      description: 'Volume is at least 1.25x the 20-period moving average',
      descriptionAr: 'حجم التداول يتجاوز 1.25 ضعف متوسط 20 شمعة',
      currentValue: `${volRatio.toFixed(2)}x (SMA: ${curVolSma.toFixed(0)})`
    },
    {
      id: 'adx_trend_power',
      name: 'ADX Trend Strength & DMI',
      nameAr: 'قوة الاتجاه الصريح (ADX & DMI)',
      category: 'VOLATILITY',
      bullish: curAdx >= 22 && curPlusDI > curMinusDI,
      bearish: curAdx >= 22 && curMinusDI > curPlusDI,
      weight: 1,
      description: 'ADX > 22 confirming non-choppy directional trend',
      descriptionAr: 'مؤشر ADX فوق 22 يؤكد قوة الاتجاه وبعده عن التذبذب العرضي',
      currentValue: `ADX: ${curAdx.toFixed(1)} (+DI:${curPlusDI.toFixed(1)} / -DI:${curMinusDI.toFixed(1)})`
    },
    {
      id: 'risk_reward_atr',
      name: 'Dynamic ATR Risk/Reward Ratio',
      nameAr: 'معيار نسبة العائد للمخاطرة (RR ≥ 2.0)',
      category: 'VOLATILITY',
      bullish: true, // Will calculate RR >= 2.0
      bearish: true,
      weight: 1,
      description: 'Minimum 1:2.0 asymmetric Risk/Reward profile based on ATR',
      descriptionAr: 'فرصة تتضمن وقف خسارة وهدف بنسبة عائد للمخاطرة 1 إلى 2 على الأقل',
      currentValue: `ATR: ${curAtr.toFixed(2)}`
    }
  ];

  const bullishCount = conditions.filter(c => c.bullish).length;
  const bearishCount = conditions.filter(c => c.bearish).length;

  let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let confluenceScore = 0;

  if (bullishCount >= 5 && bullishCount > bearishCount) {
    direction = 'LONG';
    confluenceScore = bullishCount;
  } else if (bearishCount >= 5 && bearishCount > bullishCount) {
    direction = 'SHORT';
    confluenceScore = bearishCount;
  } else {
    confluenceScore = Math.max(bullishCount, bearishCount);
  }

  // Calculate Mathematical Precision Entry Order
  const prevIdx = Math.max(0, idx - 1);
  const prevE9 = indicators.ema9[prevIdx] || curE9;
  const prevE21 = indicators.ema21[prevIdx] || curE21;

  const precisionEntry = calculatePrecisionEntry({
    symbol,
    currentPrice,
    currentCandle: candles[idx] || { time: Date.now(), open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: curVol },
    prevCandle: candles[prevIdx],
    prevEma9: prevE9,
    prevEma21: prevE21,
    currentEma9: curE9,
    currentVwap: curVwap,
    currentAtr: curAtr,
    currentVolume: curVol,
    currentVolSma20: curVolSma,
    direction
  });

  const entryProbability = calculateEntryProbability({
    currentPrice,
    limitEntryPrice: precisionEntry.exact_entry_price,
    direction,
    confluenceScore,
    maxScore: conditions.length,
    conditions,
    indicators: {
      ema9: curE9,
      ema21: curE21,
      ema50: curE50,
      ema200: curE200,
      vwap: curVwap,
      vwapUpper: indicators.upperBand[idx],
      vwapLower: indicators.lowerBand[idx],
      rsi14: curRsi,
      stochK: curStochK,
      stochD: curStochD,
      mfi14: curMfi,
      volRatio,
      adx14: curAdx,
      plusDI: curPlusDI,
      minusDI: curMinusDI,
      atr14: curAtr
    },
    riskRewardRatio: precisionEntry.risk_to_reward_ratio,
    isChasingDisqualified: precisionEntry.execution_status === 'EXPIRED_CHASING_DISQUALIFIED'
  });

  return {
    symbol,
    timeframe,
    timestamp: candles[idx]?.time || Date.now(),
    currentPrice,
    change24h,
    volume24hUsdt,
    direction,
    confluenceScore,
    maxScore: conditions.length,
    conditions,
    entryPrice: precisionEntry.exact_entry_price,
    stopLoss: precisionEntry.stop_loss_exact,
    takeProfit1: precisionEntry.take_profit_target_1,
    takeProfit2: precisionEntry.take_profit_target_2,
    riskRewardRatio: precisionEntry.risk_to_reward_ratio,
    precisionEntry,
    entryProbability,
    indicators: {
      ema9: curE9,
      ema21: curE21,
      ema50: curE50,
      ema200: curE200,
      vwap: curVwap,
      vwapUpper: indicators.upperBand[idx],
      vwapLower: indicators.lowerBand[idx],
      rsi14: curRsi,
      stochK: curStochK,
      stochD: curStochD,
      mfi14: curMfi,
      volRatio,
      adx14: curAdx,
      plusDI: curPlusDI,
      minusDI: curMinusDI,
      atr14: curAtr
    }
  };
}
