import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Shield, Target, Code, Copy, Check, Cpu, AlertTriangle, Crosshair, Zap, Layers, AlertCircle } from 'lucide-react';
import { SignalAnalysis } from '../types/quant';
import { Language, translations } from '../i18n/translations';
import { BINANCE_COINS_CATALOG } from '../lib/binanceApi';

interface ConfluenceModalProps {
  signal: SignalAnalysis | null;
  onClose: () => void;
  onRunBacktest: (symbol: string) => void;
  lang: Language;
}

export const ConfluenceModal: React.FC<ConfluenceModalProps> = ({
  signal,
  onClose,
  onRunBacktest,
  lang,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'precision' | 'confluence' | 'futures'>('precision');
  const [leverage, setLeverage] = useState<number>(5);

  if (!signal) return null;
  const t = translations[lang];

  const p = signal.precisionEntry;
  const isLong = signal.direction === 'LONG';
  const isShort = signal.direction === 'SHORT';
  const isChasingDisqualified = p.execution_status === 'EXPIRED_CHASING_DISQUALIFIED';

  // Construct official JSON payload conforming strictly to schema
  const payloadToDisplay = {
    symbol: p.symbol,
    direction: p.direction,
    exact_entry_price: p.exact_entry_price,
    entry_mechanism: p.entry_mechanism,
    tick_size_applied: p.tick_size_applied,
    max_allowable_price: p.max_allowable_price,
    stop_loss_exact: p.stop_loss_exact,
    take_profit_target_1: p.take_profit_target_1,
    take_profit_target_2: p.take_profit_target_2,
    risk_to_reward_ratio: p.risk_to_reward_ratio,
    execution_timeout_seconds: p.execution_timeout_seconds
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payloadToDisplay, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl font-bold font-mono tracking-tight text-white">
                {signal.symbol}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  isLong
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isShort
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-700/40 text-slate-400'
                }`}
              >
                {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : isShort ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                {isLong ? (lang === 'ar' ? 'صاعد (LONG Futures)' : 'LONG Futures') : (lang === 'ar' ? 'هابط (SHORT Futures)' : 'SHORT Futures')}
              </span>

              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                isChasingDisqualified
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
              }`}>
                {isChasingDisqualified ? t.chasingDisqualified : t.activeLimitOrder}
              </span>
            </div>

            {(() => {
              const catalogItem = BINANCE_COINS_CATALOG.find(c => c.symbol === signal.symbol || c.baseAsset === signal.symbol);
              return catalogItem ? (
                <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-2">
                  <span>{catalogItem.name}</span>
                  {catalogItem.category === 'BSTOCK' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      🏛️ Binance bStocks
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            <p className="text-xs text-slate-400 mt-1">
              {t.precisionExecutionSubtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Precision Execution, Futures Leverage & 8-factor checklist */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('precision')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'precision'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{t.precisionExecutionTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('futures')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'futures'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.futuresTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('confluence')}
            className={`flex-1 py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'confluence'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.confluenceDetails} ({signal.confluenceScore}/{signal.maxScore})</span>
          </button>
        </div>

        {/* Tab 1: Mathematical Precision Entry Engine */}
        {activeTab === 'precision' && (
          <div className="space-y-4">
            {/* Chasing Disqualification Warning if triggered */}
            {isChasingDisqualified && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>{t.chasingDisqualified}:</strong> Market price (${signal.currentPrice}) moved beyond maximum chasing tolerance (${p.max_allowable_price}). Order execution is disqualified to prevent negative slippage.
                </div>
              </div>
            )}

            {/* Entry Indicator & Win Probability Gauge Card */}
            <div className="p-4 bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-slate-700/80 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border font-mono font-extrabold ${
                    signal.entryProbability.probabilityPct >= 80
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-950/50'
                      : signal.entryProbability.probabilityPct >= 70
                      ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-950/50'
                      : signal.entryProbability.probabilityPct >= 55
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-400'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-400'
                  }`}>
                    <span className="text-lg leading-none">{signal.entryProbability.probabilityPct}</span>
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-medium">{t.winProbability}</div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{lang === 'ar' ? signal.entryProbability.tierLabelAr : signal.entryProbability.tierLabelEn}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        signal.entryProbability.verdict === 'CONFIRMED_BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : signal.entryProbability.verdict === 'CONFIRMED_SELL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : signal.entryProbability.verdict === 'WAIT_RETEST'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {lang === 'ar' ? signal.entryProbability.verdictLabelAr : signal.entryProbability.verdictLabelEn}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">{t.recommendedAction}</div>
                  <div className="text-xs font-medium text-slate-300 mt-0.5 max-w-xs sm:text-right">
                    {lang === 'ar' ? signal.entryProbability.recommendedActionAr : signal.entryProbability.recommendedActionEn}
                  </div>
                </div>
              </div>

              {/* Sub-Scores 4-Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>{t.trendScore}</span>
                    <span className="font-mono font-bold text-cyan-400">{signal.entryProbability.subScores.trendScore}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${signal.entryProbability.subScores.trendScore}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>{t.volumeScore}</span>
                    <span className="font-mono font-bold text-emerald-400">{signal.entryProbability.subScores.volumeScore}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${signal.entryProbability.subScores.volumeScore}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>{t.momentumScore}</span>
                    <span className="font-mono font-bold text-amber-400">{signal.entryProbability.subScores.momentumScore}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${signal.entryProbability.subScores.momentumScore}%` }} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>{t.riskRewardScore}</span>
                    <span className="font-mono font-bold text-purple-400">{signal.entryProbability.subScores.riskRewardScore}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${signal.entryProbability.subScores.riskRewardScore}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Core Mathematical Execution Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div>
                <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-emerald-400" />
                  <span>{t.exactLimitEntry}</span>
                </div>
                <div className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  ${p.exact_entry_price < 1 ? p.exact_entry_price.toFixed(6) : p.exact_entry_price.toFixed(2)}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Tick: {p.tick_size_applied}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-rose-400" />
                  <span>{t.stopLoss}</span>
                </div>
                <div className="font-mono text-base font-bold text-rose-400 tabular-nums">
                  ${p.stop_loss_exact < 1 ? p.stop_loss_exact.toFixed(6) : p.stop_loss_exact.toFixed(2)}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Dynamic 1.5 ATR
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span>{t.takeProfit} / TP2</span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
                  ${p.take_profit_target_1 < 1 ? p.take_profit_target_1.toFixed(6) : p.take_profit_target_1.toFixed(2)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  TP2: ${p.take_profit_target_2 < 1 ? p.take_profit_target_2.toFixed(6) : p.take_profit_target_2.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">{t.riskReward}</div>
                <div className="font-mono text-base font-bold text-amber-300 tabular-nums">
                  1:{p.risk_to_reward_ratio}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Timeout: {p.execution_timeout_seconds}s
                </div>
              </div>
            </div>

            {/* Precision Pricing Mechanism Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400 font-medium text-[11px]">{t.entryMechanism}</div>
                <div className="font-mono font-bold text-cyan-300 text-xs">
                  {p.entry_mechanism}
                </div>
                <div className="text-[10px] text-slate-500">
                  Calculated via closed-form OTE 50% & pre-cross confluence.
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400 font-medium text-[11px]">{t.maxAllowablePrice}</div>
                <div className="font-mono font-bold text-amber-300 text-xs tabular-nums">
                  ${p.max_allowable_price < 1 ? p.max_allowable_price.toFixed(6) : p.max_allowable_price.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  0.25 × ATR({signal.indicators.atr14.toFixed(2)}) Chasing Tolerance Cap
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400 font-medium text-[11px]">{t.pCrossPrice}</div>
                <div className="font-mono font-bold text-white text-xs tabular-nums">
                  ${p.p_cross_price < 1 ? p.p_cross_price.toFixed(6) : p.p_cross_price.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Exact price where EMA 9 equals EMA 21 on active bar.
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                <div className="text-slate-400 font-medium text-[11px]">Current Market Price & Drift</div>
                <div className="font-mono font-bold text-white text-xs tabular-nums">
                  ${signal.currentPrice < 1 ? signal.currentPrice.toFixed(6) : signal.currentPrice.toFixed(2)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Distance: {p.current_distance_atr} ATR away from limit order
                </div>
              </div>
            </div>

            {/* Official JSON Payload Box (Schema 4) */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.jsonPayload}</span>
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? t.jsonCopied : t.copyJson}</span>
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed select-all">
                <code>{JSON.stringify(payloadToDisplay, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab: Futures & Leverage Calculator */}
        {activeTab === 'futures' && (
          <div className="space-y-4">
            {/* Direction Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLong
                ? 'bg-emerald-950/30 border-emerald-800/60'
                : 'bg-rose-950/30 border-rose-800/60'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs text-slate-400">{t.futuresDirection}</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className={isLong ? 'text-emerald-400' : 'text-rose-400'}>
                      {isLong ? (lang === 'ar' ? 'صفقة شراء صاعدة (LONG)' : 'Long Position (Bullish)') : (lang === 'ar' ? 'صفقة بيع هابطة (SHORT)' : 'Short Position (Bearish)')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      USDT-M Perpetual
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 sm:text-right">
                {isLong
                  ? (lang === 'ar' ? 'تحقيق الأرباح مع صعود السعر نحو الأهداف' : 'Profits realized as price rallies toward targets')
                  : (lang === 'ar' ? 'تحقيق الأرباح مع هبوط السعر نحو الأهداف' : 'Profits realized as price drops toward targets')}
              </div>
            </div>

            {/* Leverage Selector */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.leverage}</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{leverage}x Leverage</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[1, 3, 5, 10, 20].map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setLeverage(lev)}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-colors border ${
                      leverage === lev
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* Futures Computed Metrics Grid */}
            {(() => {
              const entry = p.exact_entry_price;
              const sl = p.stop_loss_exact;
              const tp1 = p.take_profit_target_1;
              const tp2 = p.take_profit_target_2;
              const mmr = 0.005; // 0.5% maintenance margin

              let liqPrice = 0;
              let roeTP1 = 0;
              let roeTP2 = 0;
              let riskSL = 0;

              if (isLong) {
                liqPrice = Math.max(0, entry * (1 - (1 / leverage) + mmr));
                roeTP1 = ((tp1 - entry) / (entry || 1)) * leverage * 100;
                roeTP2 = ((tp2 - entry) / (entry || 1)) * leverage * 100;
                riskSL = ((entry - sl) / (entry || 1)) * leverage * 100;
              } else {
                liqPrice = entry * (1 + (1 / leverage) - mmr);
                roeTP1 = ((entry - tp1) / (entry || 1)) * leverage * 100;
                roeTP2 = ((entry - tp2) / (entry || 1)) * leverage * 100;
                riskSL = ((sl - entry) / (entry || 1)) * leverage * 100;
              }

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
                    {/* Exact Entry */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5">{t.entry}</div>
                      <div className="font-mono text-sm font-bold text-white tabular-nums">
                        ${entry < 1 ? entry.toFixed(6) : entry.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">Limit Maker</div>
                    </div>

                    {/* Estimated Liquidation Price */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{t.liquidationPrice}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-rose-400 tabular-nums">
                        ${liqPrice < 1 ? liqPrice.toFixed(6) : liqPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">Isolated Margin</div>
                    </div>

                    {/* ROE at TP1 */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-400" />
                        <span>{t.projectedROE} (TP1)</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                        +{roeTP1.toFixed(1)}% ROE
                      </div>
                      <div className="text-[10px] font-mono text-emerald-300/80">
                        TP2: +{roeTP2.toFixed(1)}% ROE
                      </div>
                    </div>

                    {/* Margin Risk at SL */}
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>{t.marginRisk}</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-rose-400 tabular-nums">
                        -{riskSL.toFixed(1)}% Margin
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {lang === 'ar' ? 'قبل التصفية بكثير' : 'Well before liquidation'}
                      </div>
                    </div>
                  </div>

                  {/* Safety Buffer Explanation Banner */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white mb-0.5">{t.safeLiquidationBuffer}:</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {lang === 'ar'
                          ? `وقف الخسارة محدد عند $${sl < 1 ? sl.toFixed(6) : sl.toFixed(2)}، وهو يقع بمسافة أمان كافية قبل سعر التصفية ($${liqPrice < 1 ? liqPrice.toFixed(6) : liqPrice.toFixed(2)}) لحماية رأس مالك تماماً من المارجن كول.`
                          : `Stop Loss is locked at $${sl < 1 ? sl.toFixed(6) : sl.toFixed(2)}, well protected before the estimated liquidation level ($${liqPrice < 1 ? liqPrice.toFixed(6) : liqPrice.toFixed(2)}).`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 2: The 8 Indicator Confluence Conditions */}
        {activeTab === 'confluence' && (
          <div className="space-y-2">
            {signal.conditions.map((cond) => {
              const passed = isLong ? cond.bullish : isShort ? cond.bearish : (cond.bullish || cond.bearish);
              return (
                <div
                  key={cond.id}
                  className={`p-3 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                    passed
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-slate-900/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {lang === 'ar' ? cond.nameAr : cond.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {lang === 'ar' ? cond.descriptionAr : cond.description}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs tabular-nums text-right text-slate-300 shrink-0 bg-slate-800/60 px-2 py-1 rounded">
                    {cond.currentValue}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {t.closeModal}
          </button>
          <button
            onClick={() => {
              onClose();
              onRunBacktest(signal.symbol);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>{t.backtestThis}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
