export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  vwap: number;
  vwapUpper: number;
  vwapLower: number;
  rsi14: number;
  stochK: number;
  stochD: number;
  mfi14: number;
  volRatio: number; // Current volume vs 20 SMA
  adx14: number;
  plusDI: number;
  minusDI: number;
  atr14: number;
}

export interface ConfluenceCondition {
  id: string;
  name: string;
  nameAr: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLUME' | 'VOLATILITY';
  bullish: boolean;
  bearish: boolean;
  weight: number;
  description: string;
  descriptionAr: string;
  currentValue: string;
}

export type EntryMechanism =
  | 'EMA_CROSS_50PCT_EQUILIBRIUM'
  | 'EMA_PRE_CROSS_EQUILIBRIUM'
  | 'OTE_50PCT_EQUILIBRIUM'
  | 'VWAP_ANCHOR_CONFLUENCE'
  | 'EMA9_PULLBACK_ANCHOR';

export type ExecutionStatus = 'ACTIVE_LIMIT_ORDER' | 'EXPIRED_CHASING_DISQUALIFIED';

export type EntryConfidenceTier =
  | 'ELITE_SNIPER'       // >= 80%
  | 'HIGH_PROBABILITY'   // 70% - 79%
  | 'MODERATE'           // 55% - 69%
  | 'LOW_PROBABILITY';   // < 55%

export type EntryVerdict =
  | 'CONFIRMED_BUY'
  | 'CONFIRMED_SELL'
  | 'WAIT_RETEST'
  | 'AVOID';

/**
 * Entry Probability & Accuracy Indicator Data
 * ("مؤشر الدخول ونسبة الدخول الصحيحة")
 */
export interface EntryProbabilityDetails {
  probabilityPct: number; // e.g. 84.5% - نسبة الدخول الصحيحة
  confidenceTier: EntryConfidenceTier;
  tierLabelAr: string;
  tierLabelEn: string;
  verdict: EntryVerdict;
  verdictLabelAr: string;
  verdictLabelEn: string;
  subScores: {
    trendScore: number;     // 0 - 100
    volumeScore: number;    // 0 - 100
    momentumScore: number;  // 0 - 100
    riskRewardScore: number;// 0 - 100
  };
  recommendedActionAr: string;
  recommendedActionEn: string;
}

/**
 * Mathematical Precision Entry Execution Output Schema
 * strictly conforms to institutional quant execution payload requirements
 */
export interface PrecisionEntryPayload {
  symbol: string;
  direction: 'BUY' | 'SELL';
  exact_entry_price: number;
  entry_mechanism: EntryMechanism;
  tick_size_applied: number;
  max_allowable_price: number;
  stop_loss_exact: number;
  take_profit_target_1: number;
  take_profit_target_2: number;
  risk_to_reward_ratio: number;
  execution_timeout_seconds: number;
  order_type: 'LIMIT';
  execution_status: ExecutionStatus;
  p_cross_price: number;
  chasing_tolerance_atr: number;
  current_distance_atr: number;
}

export interface SignalAnalysis {
  symbol: string;
  timeframe: string;
  timestamp: number;
  currentPrice: number;
  change24h: number;
  volume24hUsdt: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confluenceScore: number; // e.g. 7 out of 8
  maxScore: number; // 8
  conditions: ConfluenceCondition[];
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  indicators: IndicatorValues;
  precisionEntry: PrecisionEntryPayload;
  entryProbability: EntryProbabilityDetails;
}

export interface BacktestConfig {
  symbol: string;
  timeframe: string;
  candleLimit: number;
  trainRatio: number; // e.g. 0.70 (70% In-Sample, 30% Out-of-Sample)
  feeRate: number; // Mandatory 0.0006 (0.06%)
  slippageRate: number; // e.g. 0.0005 (0.05%)
  initialCapital: number; // e.g. 10000
  minConfluence: number; // e.g. 6 of 8
  directionMode: 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
  useAtrTrailing: boolean;
  atrMultiplierSL: number; // e.g. 1.5
  atrMultiplierTP: number; // e.g. 3.0
  rsiOverbought: number;
  rsiOversold: number;
  usePrecisionLimitOrders: boolean; // Enables the smart limit entry & chasing filter
  minEntryProbability?: number; // Filter for minimum win probability % (e.g. 70%)
}

export interface TradeRecord {
  id: string;
  entryTime: number;
  exitTime: number;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  capitalBefore: number;
  pnlDollar: number;
  pnlPercent: number;
  feePaid: number;
  slippagePaid: number;
  barsHeld: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_FLIP' | 'END_OF_SAMPLE';
  sampleType: 'IN_SAMPLE' | 'OUT_OF_SAMPLE';
  entryMechanism?: EntryMechanism;
  entryProbabilityPct?: number;
}

export interface BacktestMetrics {
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgTradePct: number;
  avgWinPct: number;
  avgLossPct: number;
  expectancy: number;
  totalFeesPaid: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  inSampleMetrics: BacktestMetrics;
  outOfSampleMetrics: BacktestMetrics;
  fullMetrics: BacktestMetrics;
  benchmarkReturnPct: number;
  alpha: number;
  beta: number;
  overfittingRatio: number; // Sharpe_OOS / Sharpe_IS (Ideal ~0.7 to 1.1)
  overfittingStatus: 'ROBUST' | 'MODERATE_DEGRADATION' | 'SEVERE_OVERFITTING';
  equitySeries: {
    time: number;
    equity: number;
    benchmark: number;
    drawdown: number;
    sampleType: 'IN_SAMPLE' | 'OUT_OF_SAMPLE';
  }[];
  trades: TradeRecord[];
}
