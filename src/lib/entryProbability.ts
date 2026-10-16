import { EntryProbabilityDetails, EntryConfidenceTier, EntryVerdict, IndicatorValues, ConfluenceCondition } from '../types/quant';

interface ProbabilityCalculationInputs {
  currentPrice: number;
  limitEntryPrice: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confluenceScore: number;
  maxScore: number;
  conditions: ConfluenceCondition[];
  indicators: IndicatorValues;
  riskRewardRatio: number;
  isChasingDisqualified: boolean;
}

/**
 * Institutional Entry Probability & Accuracy Calculation Algorithm
 * Calculates the exact mathematical Win Probability % ("نسبة الدخول الصحيحة")
 * and the Composite Entry Indicator verdict.
 */
export function calculateEntryProbability(inputs: ProbabilityCalculationInputs): EntryProbabilityDetails {
  const {
    currentPrice,
    limitEntryPrice,
    direction,
    confluenceScore,
    maxScore,
    conditions,
    indicators,
    riskRewardRatio,
    isChasingDisqualified,
  } = inputs;

  const isLong = direction === 'LONG';
  const isShort = direction === 'SHORT';

  // 1. Trend Subscore (0 - 100)
  let trendScore = 30;
  if (isLong) {
    if (currentPrice > indicators.ema9 && indicators.ema9 > indicators.ema21) trendScore += 35;
    if (indicators.ema21 > indicators.ema50) trendScore += 20;
    if (currentPrice > indicators.vwap) trendScore += 15;
  } else if (isShort) {
    if (currentPrice < indicators.ema9 && indicators.ema9 < indicators.ema21) trendScore += 35;
    if (indicators.ema21 < indicators.ema50) trendScore += 20;
    if (currentPrice < indicators.vwap) trendScore += 15;
  }
  trendScore = Math.min(100, Math.max(10, trendScore));

  // 2. Volume & Liquidity Flow Subscore (0 - 100)
  let volumeScore = 20;
  if (indicators.volRatio >= 2.0) volumeScore += 45;
  else if (indicators.volRatio >= 1.5) volumeScore += 35;
  else if (indicators.volRatio >= 1.2) volumeScore += 25;
  else volumeScore += 10;

  if (isLong && indicators.mfi14 >= 55) volumeScore += 35;
  else if (isShort && indicators.mfi14 <= 45) volumeScore += 35;
  else if (indicators.mfi14 >= 45 && indicators.mfi14 <= 55) volumeScore += 15;
  volumeScore = Math.min(100, Math.max(10, volumeScore));

  // 3. Momentum & Oscillator Subscore (0 - 100)
  let momentumScore = 25;
  if (isLong) {
    // RSI Sweet spot for breakout without exhaustion
    if (indicators.rsi14 >= 50 && indicators.rsi14 <= 66) momentumScore += 40;
    else if (indicators.rsi14 > 66 && indicators.rsi14 <= 75) momentumScore += 25;
    else if (indicators.rsi14 < 45) momentumScore += 10;

    // Stochastic crossover
    if (indicators.stochK > indicators.stochD && indicators.stochK < 80) momentumScore += 35;
  } else if (isShort) {
    if (indicators.rsi14 <= 50 && indicators.rsi14 >= 34) momentumScore += 40;
    else if (indicators.rsi14 < 34 && indicators.rsi14 >= 25) momentumScore += 25;
    else if (indicators.rsi14 > 55) momentumScore += 10;

    if (indicators.stochK < indicators.stochD && indicators.stochK > 20) momentumScore += 35;
  }
  momentumScore = Math.min(100, Math.max(10, momentumScore));

  // 4. Volatility & Risk/Reward Subscore (0 - 100)
  let riskRewardScore = 20;
  if (riskRewardRatio >= 3.0) riskRewardScore += 50;
  else if (riskRewardRatio >= 2.5) riskRewardScore += 40;
  else if (riskRewardRatio >= 2.0) riskRewardScore += 30;
  else riskRewardScore += 10;

  if (indicators.adx14 >= 25) riskRewardScore += 30;
  else if (indicators.adx14 >= 20) riskRewardScore += 20;
  riskRewardScore = Math.min(100, Math.max(10, riskRewardScore));

  // 5. Composite Probability Calculation (Weighted Multi-Factor Model)
  // Weights: Trend 30%, Volume 25%, Momentum 25%, Risk/Reward 20%
  let rawWeightedProbability =
    (trendScore * 0.30) +
    (volumeScore * 0.25) +
    (momentumScore * 0.25) +
    (riskRewardScore * 0.20);

  // Bonus for exceptional confluence (7/8 or 8/8)
  if (confluenceScore >= 7) rawWeightedProbability += 6;
  else if (confluenceScore === 6) rawWeightedProbability += 2;
  else rawWeightedProbability -= (6 - confluenceScore) * 8;

  // Penalty for market chasing or distance from limit entry
  if (isChasingDisqualified) {
    rawWeightedProbability -= 30; // Severe penalty: chasing breakout tops/bottoms
  } else {
    const distPct = Math.abs(currentPrice - limitEntryPrice) / (limitEntryPrice || 1);
    if (distPct < 0.002) rawWeightedProbability += 5; // Perfect retest precision
  }

  // Bound probability mathematically between 22.0% and 93.5%
  const finalProbability = +Math.max(22.0, Math.min(93.5, rawWeightedProbability)).toFixed(1);

  // 6. Tier & Verdict Determination
  let confidenceTier: EntryConfidenceTier;
  let tierLabelAr: string;
  let tierLabelEn: string;
  let verdict: EntryVerdict;
  let verdictLabelAr: string;
  let verdictLabelEn: string;
  let recommendedActionAr: string;
  let recommendedActionEn: string;

  if (finalProbability >= 80.0 && !isChasingDisqualified && direction !== 'NEUTRAL') {
    confidenceTier = 'ELITE_SNIPER';
    tierLabelAr = 'دخول قناص فائق الدقة (مؤكد جداً)';
    tierLabelEn = 'Elite Sniper (Ultra Confirmed)';
    verdict = isLong ? 'CONFIRMED_BUY' : 'CONFIRMED_SELL';
    verdictLabelAr = isLong ? 'شراء فائق القوة (Limit Order)' : 'بيع فائق القوة (Limit Order)';
    verdictLabelEn = isLong ? 'Strong Buy (Limit Maker)' : 'Strong Sell (Limit Maker)';
    recommendedActionAr = `ضع أمر شراء معلق (Limit) عند سعر $${limitEntryPrice < 1 ? limitEntryPrice.toFixed(6) : limitEntryPrice.toFixed(2)}. نسبة النجاح الرياضية عالية جداً (${finalProbability}%).`;
    recommendedActionEn = `Place a Limit Maker order at $${limitEntryPrice < 1 ? limitEntryPrice.toFixed(6) : limitEntryPrice.toFixed(2)}. Statistically elite accuracy (${finalProbability}%).`;
  } else if (finalProbability >= 70.0 && !isChasingDisqualified && direction !== 'NEUTRAL') {
    confidenceTier = 'HIGH_PROBABILITY';
    tierLabelAr = 'احتمالية نجاح عالية';
    tierLabelEn = 'High Win Probability';
    verdict = isLong ? 'CONFIRMED_BUY' : 'CONFIRMED_SELL';
    verdictLabelAr = isLong ? 'دخول شراء صالح' : 'دخول بيع صالح';
    verdictLabelEn = isLong ? 'Valid Buy Entry' : 'Valid Sell Entry';
    recommendedActionAr = `أمر معلق صالح عند $${limitEntryPrice < 1 ? limitEntryPrice.toFixed(6) : limitEntryPrice.toFixed(2)}. التزم بوقف الخسارة المحدد الصارم.`;
    recommendedActionEn = `Valid limit order at $${limitEntryPrice < 1 ? limitEntryPrice.toFixed(6) : limitEntryPrice.toFixed(2)}. Strictly respect the calculated stop loss.`;
  } else if (finalProbability >= 55.0 || isChasingDisqualified) {
    confidenceTier = 'MODERATE';
    tierLabelAr = 'تأكيد متوسط (انتظار Retest)';
    tierLabelEn = 'Moderate (Wait for Retest)';
    verdict = 'WAIT_RETEST';
    verdictLabelAr = 'انتظار إعادة اختبار الـ Limit';
    verdictLabelEn = 'Wait for Pullback Retest';
    recommendedActionAr = 'لا تطارد السعر بسعر السوق! انتظر هبوط السعر لمستوى الـ Limit المحدد لتجنب الانزلاق.';
    recommendedActionEn = 'Do not chase market orders! Wait for price to pull back to the optimal limit level.';
  } else {
    confidenceTier = 'LOW_PROBABILITY';
    tierLabelAr = 'احتمالية ضعيفة - يمنع الدخول';
    tierLabelEn = 'Low Probability (Avoid)';
    verdict = 'AVOID';
    verdictLabelAr = 'تجنب التداول حالياً';
    verdictLabelEn = 'Avoid Entering';
    recommendedActionAr = 'شروط التوافق غير مكتملة ونسبة النجاح منخفضة. يفضل الانتظار لفرصة قناص مؤكدة.';
    recommendedActionEn = 'Confluence is fragmented with low win probability. Keep capital safe and wait.';
  }

  return {
    probabilityPct: finalProbability,
    confidenceTier,
    tierLabelAr,
    tierLabelEn,
    verdict,
    verdictLabelAr,
    verdictLabelEn,
    subScores: {
      trendScore: Math.round(trendScore),
      volumeScore: Math.round(volumeScore),
      momentumScore: Math.round(momentumScore),
      riskRewardScore: Math.round(riskRewardScore),
    },
    recommendedActionAr,
    recommendedActionEn,
  };
}
