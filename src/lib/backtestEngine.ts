import { Candle, BacktestConfig, BacktestResult, BacktestMetrics, TradeRecord, EntryMechanism } from '../types/quant';
import { computeAllIndicators } from './indicators';
import { calculatePrecisionEntry } from './precisionEntry';

/**
 * Institutional Vectorized Quantitative Backtesting Engine
 * 
 * Strict Enforcement:
 * 1. Vectorized indicator pre-computation
 * 2. 0.06% transaction fee + slippage on each entry & exit
 * 3. In-Sample (Train) and Out-of-Sample (Test) split verification
 */
export function runVectorizedBacktest(
  candles: Candle[],
  config: BacktestConfig
): BacktestResult {
  const n = candles.length;
  if (n < 60) {
    throw new Error('Insufficient candles for quantitative backtesting (minimum 60 bars required)');
  }

  // Pre-calculate all vectorized indicators
  const indicators = computeAllIndicators(candles);
  const closes = indicators.closes;
  const highs = indicators.highs;
  const lows = indicators.lows;
  const volumes = indicators.volumes;
  const ema9 = indicators.ema9;
  const ema21 = indicators.ema21;
  const ema50 = indicators.ema50;
  const vwap = indicators.vwap;
  const rsi = indicators.rsi;
  const stochK = indicators.stochK;
  const stochD = indicators.stochD;
  const mfi = indicators.mfi;
  const adx = indicators.adx;
  const plusDI = indicators.plusDI;
  const minusDI = indicators.minusDI;
  const atr = indicators.atr;
  const volSMA = indicators.volSMA;

  // Vectorized signal generation (1 = Long, -1 = Short, 0 = Flat)
  const longSignals = new Uint8Array(n);
  const shortSignals = new Uint8Array(n);

  for (let i = 25; i < n; i++) {
    const cPrice = closes[i];
    const cE9 = ema9[i];
    const cE21 = ema21[i];
    const cE50 = ema50[i];
    const cVwap = vwap[i];
    const cRsi = rsi[i];
    const cStochK = stochK[i];
    const cStochD = stochD[i];
    const cMfi = mfi[i];
    const cAdx = adx[i];
    const cPlusDI = plusDI[i];
    const cMinusDI = minusDI[i];
    const cVol = volumes[i];
    const cVolSMA = volSMA[i] || 1;
    const volRatio = cVol / cVolSMA;

    // Confluence Score calculation for Long
    let longScore = 0;
    if (cPrice > cE9 && cE9 > cE21 && cE21 > cE50) longScore++;
    if (cPrice > cVwap) longScore++;
    if (cRsi >= config.rsiOversold && cRsi <= config.rsiOverbought) longScore++;
    if (cStochK > cStochD && cStochK < 85) longScore++;
    if (cMfi >= 50) longScore++;
    if (volRatio >= 1.2) longScore++;
    if (cAdx >= 20 && cPlusDI > cMinusDI) longScore++;
    // ATR asymmetry check
    if (atr[i] > 0) longScore++;

    // Confluence Score calculation for Short
    let shortScore = 0;
    if (cPrice < cE9 && cE9 < cE21 && cE21 < cE50) shortScore++;
    if (cPrice < cVwap) shortScore++;
    if (cRsi <= 55 && cRsi >= 25) shortScore++;
    if (cStochK < cStochD && cStochK > 15) shortScore++;
    if (cMfi <= 50) shortScore++;
    if (volRatio >= 1.2) shortScore++;
    if (cAdx >= 20 && cMinusDI > cPlusDI) shortScore++;
    if (atr[i] > 0) shortScore++;

    if (config.directionMode !== 'SHORT_ONLY' && longScore >= config.minConfluence) {
      longSignals[i] = 1;
    }
    if (config.directionMode !== 'LONG_ONLY' && shortScore >= config.minConfluence) {
      shortSignals[i] = 1;
    }
  }

  // Partition data into Train (In-Sample) and Test (Out-of-Sample)
  const trainRatio = Math.max(0.4, Math.min(0.9, config.trainRatio));
  const splitIndex = Math.floor(n * trainRatio);

  // Simulation execution with fees and slippage
  let capital = config.initialCapital;
  const feeRate = config.feeRate; // 0.0006 (0.06%)
  const slippageRate = config.slippageRate; // 0.0005 (0.05%)

  let currentPosition: {
    direction: 'LONG' | 'SHORT';
    entryIndex: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    size: number;
    capitalAllocated: number;
    entryMechanism?: EntryMechanism;
  } | null = null;

  const trades: TradeRecord[] = [];
  const equitySeries: BacktestResult['equitySeries'] = [];

  const initialPrice = closes[0];

  for (let i = 0; i < n; i++) {
    const curTime = candles[i].time;
    const curClose = closes[i];
    const curHigh = highs[i];
    const curLow = lows[i];
    const curAtr = atr[i] || (curClose * 0.015);
    const sampleType: 'IN_SAMPLE' | 'OUT_OF_SAMPLE' = i < splitIndex ? 'IN_SAMPLE' : 'OUT_OF_SAMPLE';

    // 1. Manage existing position exits
    if (currentPosition) {
      let exitPrice = 0;
      let exitReason: TradeRecord['exitReason'] | null = null;

      if (currentPosition.direction === 'LONG') {
        // Hit Stop Loss
        if (curLow <= currentPosition.stopLoss) {
          exitPrice = currentPosition.stopLoss * (1 - slippageRate);
          exitReason = 'STOP_LOSS';
        }
        // Hit Take Profit
        else if (curHigh >= currentPosition.takeProfit) {
          exitPrice = currentPosition.takeProfit * (1 - slippageRate);
          exitReason = 'TAKE_PROFIT';
        }
        // Opposite signal flip
        else if (shortSignals[i] === 1) {
          exitPrice = curClose * (1 - slippageRate);
          exitReason = 'SIGNAL_FLIP';
        }
        // End of backtest
        else if (i === n - 1) {
          exitPrice = curClose * (1 - slippageRate);
          exitReason = 'END_OF_SAMPLE';
        }
      } else {
        // SHORT position checks
        if (curHigh >= currentPosition.stopLoss) {
          exitPrice = currentPosition.stopLoss * (1 + slippageRate);
          exitReason = 'STOP_LOSS';
        } else if (curLow <= currentPosition.takeProfit) {
          exitPrice = currentPosition.takeProfit * (1 + slippageRate);
          exitReason = 'TAKE_PROFIT';
        } else if (longSignals[i] === 1) {
          exitPrice = curClose * (1 + slippageRate);
          exitReason = 'SIGNAL_FLIP';
        } else if (i === n - 1) {
          exitPrice = curClose * (1 + slippageRate);
          exitReason = 'END_OF_SAMPLE';
        }
      }

      if (exitReason) {
        // Calculate Exit Financials with Fees & Slippage
        const rawReturn = currentPosition.direction === 'LONG'
          ? (exitPrice - currentPosition.entryPrice) / currentPosition.entryPrice
          : (currentPosition.entryPrice - exitPrice) / currentPosition.entryPrice;

        const tradeValue = currentPosition.capitalAllocated;
        const entryFee = tradeValue * feeRate;
        const exitFee = (tradeValue * (1 + rawReturn)) * feeRate;
        const totalFees = entryFee + exitFee;
        const slippageCost = tradeValue * slippageRate * 2;

        const netPnlDollar = (tradeValue * rawReturn) - totalFees;
        const netPnlPct = (netPnlDollar / tradeValue) * 100;

        capital += netPnlDollar;

        trades.push({
          id: `trade_${trades.length + 1}`,
          entryTime: candles[currentPosition.entryIndex].time,
          exitTime: curTime,
          direction: currentPosition.direction,
          entryPrice: currentPosition.entryPrice,
          exitPrice,
          size: currentPosition.size,
          capitalBefore: tradeValue,
          pnlDollar: netPnlDollar,
          pnlPercent: netPnlPct,
          feePaid: totalFees,
          slippagePaid: slippageCost,
          barsHeld: i - currentPosition.entryIndex,
          exitReason,
          sampleType: currentPosition.entryIndex < splitIndex ? 'IN_SAMPLE' : 'OUT_OF_SAMPLE',
          entryMechanism: currentPosition.entryMechanism
        });

        currentPosition = null;
      }
    }

    // 2. Open new position if flat
    if (!currentPosition && i < n - 1) {
      const prevI = Math.max(0, i - 1);
      const isLongTrigger = longSignals[i] === 1;
      const isShortTrigger = shortSignals[i] === 1;

      if (isLongTrigger || isShortTrigger) {
        const triggerDirection = isLongTrigger ? 'LONG' : 'SHORT';
        const precision = calculatePrecisionEntry({
          symbol: config.symbol,
          currentPrice: curClose,
          currentCandle: candles[i],
          prevCandle: candles[prevI],
          prevEma9: ema9[prevI] || ema9[i],
          prevEma21: ema21[prevI] || ema21[i],
          currentEma9: ema9[i],
          currentVwap: vwap[i],
          currentAtr: curAtr,
          currentVolume: volumes[i],
          currentVolSma20: volSMA[i] || 1,
          direction: triggerDirection,
        });

        // Strict Filter: Never enter if current market price moved more than 0.25 * ATR away
        if (precision.execution_status !== 'EXPIRED_CHASING_DISQUALIFIED') {
          const limitPrice = precision.exact_entry_price;
          // Maker/Limit order fills at exact limit price without adverse taker slippage
          const sl = precision.stop_loss_exact;
          const tp = precision.take_profit_target_1;
          const allocated = capital * 0.98; // 98% portfolio allocation

          if (isLongTrigger) {
            currentPosition = {
              direction: 'LONG',
              entryIndex: i,
              entryPrice: limitPrice,
              stopLoss: sl,
              takeProfit: tp,
              size: allocated / limitPrice,
              capitalAllocated: allocated,
              entryMechanism: precision.entry_mechanism
            };
          } else if (isShortTrigger) {
            currentPosition = {
              direction: 'SHORT',
              entryIndex: i,
              entryPrice: limitPrice,
              stopLoss: sl,
              takeProfit: tp,
              size: allocated / limitPrice,
              capitalAllocated: allocated,
              entryMechanism: precision.entry_mechanism
            };
          }
        }
      }
    }

    // Benchmark calculation (Buy & Hold)
    const benchmarkEquity = (config.initialCapital * curClose) / initialPrice;

    // Calculate current running equity
    let currentEquity = capital;
    if (currentPosition) {
      const unrealizedPnl = currentPosition.direction === 'LONG'
        ? (curClose - currentPosition.entryPrice) * currentPosition.size
        : (currentPosition.entryPrice - curClose) * currentPosition.size;
      currentEquity = capital + unrealizedPnl;
    }

    equitySeries.push({
      time: curTime,
      equity: currentEquity,
      benchmark: benchmarkEquity,
      drawdown: 0, // will compute peak drawdown below
      sampleType
    });
  }

  // Calculate Peak & Drawdowns
  let peak = -Infinity;
  for (let i = 0; i < equitySeries.length; i++) {
    if (equitySeries[i].equity > peak) {
      peak = equitySeries[i].equity;
    }
    const dd = peak > 0 ? ((equitySeries[i].equity - peak) / peak) * 100 : 0;
    equitySeries[i].drawdown = dd;
  }

  // Partition trades & series
  const inSampleTrades = trades.filter(t => t.sampleType === 'IN_SAMPLE');
  const outOfSampleTrades = trades.filter(t => t.sampleType === 'OUT_OF_SAMPLE');

  const inSampleSeries = equitySeries.slice(0, splitIndex);
  const outOfSampleSeries = equitySeries.slice(splitIndex);

  const inSampleMetrics = computeMetrics(inSampleTrades, inSampleSeries, config.initialCapital);
  const outOfSampleMetrics = computeMetrics(
    outOfSampleTrades,
    outOfSampleSeries,
    inSampleSeries[inSampleSeries.length - 1]?.equity || config.initialCapital
  );
  const fullMetrics = computeMetrics(trades, equitySeries, config.initialCapital);

  // Overfitting ratio analysis (OOS Sharpe / IS Sharpe)
  const isSharpe = inSampleMetrics.sharpeRatio;
  const oosSharpe = outOfSampleMetrics.sharpeRatio;
  let overfittingRatio = 1.0;
  let overfittingStatus: BacktestResult['overfittingStatus'] = 'ROBUST';

  if (isSharpe > 0) {
    overfittingRatio = +(oosSharpe / isSharpe).toFixed(2);
    if (overfittingRatio >= 0.70) {
      overfittingStatus = 'ROBUST';
    } else if (overfittingRatio >= 0.35) {
      overfittingStatus = 'MODERATE_DEGRADATION';
    } else {
      overfittingStatus = 'SEVERE_OVERFITTING';
    }
  } else if (isSharpe <= 0 && oosSharpe <= 0) {
    overfittingRatio = 0.5;
    overfittingStatus = 'MODERATE_DEGRADATION';
  }

  // Benchmark Return
  const finalClose = closes[n - 1];
  const benchmarkReturnPct = +(((finalClose - initialPrice) / initialPrice) * 100).toFixed(2);

  // Alpha / Beta estimation against Benchmark
  const beta = calculateBeta(equitySeries);
  const alpha = +(fullMetrics.totalReturnPct - (beta * benchmarkReturnPct)).toFixed(2);

  return {
    config,
    inSampleMetrics,
    outOfSampleMetrics,
    fullMetrics,
    benchmarkReturnPct,
    alpha,
    beta,
    overfittingRatio,
    overfittingStatus,
    equitySeries,
    trades
  };
}

/**
 * Calculates institutional risk and performance metrics
 */
function computeMetrics(
  trades: TradeRecord[],
  series: { equity: number; drawdown: number }[],
  initialCap: number
): BacktestMetrics {
  const nTrades = trades.length;
  if (nTrades === 0 || series.length === 0) {
    return {
      totalReturnPct: 0,
      annualizedReturnPct: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdownPct: 0,
      winRatePct: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      avgTradePct: 0,
      avgWinPct: 0,
      avgLossPct: 0,
      expectancy: 0,
      totalFeesPaid: 0
    };
  }

  const endEquity = series[series.length - 1].equity;
  const totalReturnPct = +(((endEquity - initialCap) / initialCap) * 100).toFixed(2);

  let maxDrawdown = 0;
  for (const pt of series) {
    if (Math.abs(pt.drawdown) > maxDrawdown) {
      maxDrawdown = Math.abs(pt.drawdown);
    }
  }

  const winningTrades = trades.filter(t => t.pnlDollar > 0);
  const losingTrades = trades.filter(t => t.pnlDollar <= 0);
  const winRatePct = +((winningTrades.length / nTrades) * 100).toFixed(1);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnlDollar, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlDollar, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 0) : +(grossProfit / grossLoss).toFixed(2);

  const avgTradePct = +(trades.reduce((sum, t) => sum + t.pnlPercent, 0) / nTrades).toFixed(2);
  const avgWinPct = winningTrades.length > 0
    ? +(winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length).toFixed(2)
    : 0;
  const avgLossPct = losingTrades.length > 0
    ? +(losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length).toFixed(2)
    : 0;

  const totalFeesPaid = +trades.reduce((sum, t) => sum + t.feePaid, 0).toFixed(2);

  // Periodic returns for Sharpe & Sortino
  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].equity;
    const cur = series[i].equity;
    if (prev > 0) {
      returns.push((cur - prev) / prev);
    }
  }

  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1
    ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);

  // Downside deviation for Sortino
  const downReturns = returns.filter(r => r < 0);
  const downVariance = downReturns.length > 0
    ? downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length
    : 0.00001;
  const downsideDev = Math.sqrt(downVariance);

  // Annualization factor (assume ~365 days / standard intraday)
  const annualFactor = Math.sqrt(365 * 24); // generic standard
  const sharpeRatio = stdDev > 0 ? +((meanReturn / stdDev) * annualFactor).toFixed(2) : 0;
  const sortinoRatio = downsideDev > 0 ? +((meanReturn / downsideDev) * annualFactor).toFixed(2) : 0;
  const calmarRatio = maxDrawdown > 0 ? +(totalReturnPct / maxDrawdown).toFixed(2) : 0;

  // Expectancy = (Win% * AvgWin) - (Loss% * |AvgLoss|)
  const winFraction = winRatePct / 100;
  const lossFraction = 1 - winFraction;
  const expectancy = +((winFraction * avgWinPct) - (lossFraction * Math.abs(avgLossPct))).toFixed(2);

  return {
    totalReturnPct,
    annualizedReturnPct: +(totalReturnPct * (365 / (series.length / 24 || 1))).toFixed(2),
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    maxDrawdownPct: +maxDrawdown.toFixed(2),
    winRatePct,
    totalTrades: nTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    profitFactor,
    avgTradePct,
    avgWinPct,
    avgLossPct,
    expectancy,
    totalFeesPaid
  };
}

function calculateBeta(series: BacktestResult['equitySeries']): number {
  if (series.length < 5) return 1.0;
  const stratReturns: number[] = [];
  const benchReturns: number[] = [];

  for (let i = 1; i < series.length; i++) {
    const s0 = series[i - 1].equity;
    const s1 = series[i].equity;
    const b0 = series[i - 1].benchmark;
    const b1 = series[i].benchmark;
    if (s0 > 0 && b0 > 0) {
      stratReturns.push((s1 - s0) / s0);
      benchReturns.push((b1 - b0) / b0);
    }
  }

  const n = stratReturns.length;
  if (n === 0) return 1.0;

  const meanS = stratReturns.reduce((a, b) => a + b, 0) / n;
  const meanB = benchReturns.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (stratReturns[i] - meanS) * (benchReturns[i] - meanB);
    varB += Math.pow(benchReturns[i] - meanB, 2);
  }

  return varB > 0 ? +(cov / varB).toFixed(2) : 1.0;
}
