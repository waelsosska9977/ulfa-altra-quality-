import React, { useState } from 'react';
import { Search, Eye, ArrowUpRight, ArrowDownRight, BarChart2, Plus, AlertCircle } from 'lucide-react';
import { SignalAnalysis } from '../types/quant';
import { Language, translations } from '../i18n/translations';

interface ScannerViewProps {
  signals: SignalAnalysis[];
  isLoading: boolean;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  onSelectSignal: (signal: SignalAnalysis) => void;
  onBacktestSymbol: (symbol: string) => void;
  onAddCustomSymbol: (symbol: string) => void;
  lang: Language;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  signals,
  isLoading,
  timeframe,
  setTimeframe,
  onSelectSignal,
  onBacktestSymbol,
  onAddCustomSymbol,
  lang,
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<'ALL' | 'LONGS' | 'SHORTS' | 'HIGH_CONFLUENCE' | 'HIGH_PROBABILITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');

  const timeframes = ['5m', '15m', '1h', '4h', '1d'];

  const filteredSignals = signals.filter((sig) => {
    // Search query
    if (searchQuery && !sig.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter mode
    if (filter === 'LONGS') return sig.direction === 'LONG';
    if (filter === 'SHORTS') return sig.direction === 'SHORT';
    if (filter === 'HIGH_CONFLUENCE') return sig.confluenceScore >= 7;
    if (filter === 'HIGH_PROBABILITY') return sig.entryProbability.probabilityPct >= 75;
    return true;
  });

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onAddCustomSymbol(customInput.trim().toUpperCase());
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters & Timeframes */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Custom Symbol */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchSymbolPlaceholder}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <form onSubmit={handleAddSymbol} className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="E.g. APTUSDT"
              className="w-28 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg transition-colors flex items-center justify-center"
              title="Scan Custom Symbol"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Filter Tabs & Timeframe Selection */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilter('LONGS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'LONGS' ? 'bg-emerald-950/60 text-emerald-300 shadow-sm border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterLongs}
            </button>
            <button
              onClick={() => setFilter('SHORTS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'SHORTS' ? 'bg-rose-950/60 text-rose-300 shadow-sm border border-rose-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterShorts}
            </button>
            <button
              onClick={() => setFilter('HIGH_CONFLUENCE')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'HIGH_CONFLUENCE' ? 'bg-amber-950/60 text-amber-300 shadow-sm border border-amber-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterHighConfluence}
            </button>
            <button
              onClick={() => setFilter('HIGH_PROBABILITY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'HIGH_PROBABILITY' ? 'bg-cyan-950/60 text-cyan-300 shadow-sm border border-cyan-800/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterHighProbability}
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Quantitative Table */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] font-semibold">
                <th className="py-3 px-4">{t.symbol}</th>
                <th className="py-3 px-3 text-right">{t.price}</th>
                <th className="py-3 px-3 text-right">{t.change24h}</th>
                <th className="py-3 px-3 text-center">{t.signal}</th>
                <th className="py-3 px-3">{t.winProbability}</th>
                <th className="py-3 px-3">{t.confluence}</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">{t.entry}</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">{t.stopLoss}</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">{t.takeProfit}</th>
                <th className="py-3 px-3 text-center">{t.riskReward}</th>
                <th className="py-3 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && signals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Computing live Alpha & Sosska confluence...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-slate-500" />
                      <span>No trading pairs matched the active criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isLong = sig.direction === 'LONG';
                  const isShort = sig.direction === 'SHORT';
                  const isPositiveChange = sig.change24h >= 0;
                  const scorePct = (sig.confluenceScore / sig.maxScore) * 100;

                  return (
                    <tr
                      key={sig.symbol}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Symbol */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {sig.symbol}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Vol: ${(sig.volume24hUsdt / 1_000_000).toFixed(1)}M USDT
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 font-semibold">
                        ${sig.currentPrice < 1 ? sig.currentPrice.toFixed(6) : sig.currentPrice.toFixed(2)}
                      </td>

                      {/* 24h Change */}
                      <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${
                        isPositiveChange ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositiveChange ? '+' : ''}{sig.change24h.toFixed(2)}%
                      </td>

                      {/* Signal Direction */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isLong
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isShort
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="w-3 h-3" /> : isShort ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {sig.direction}
                        </span>
                      </td>

                      {/* Entry Indicator & Win Probability % */}
                      <td className="py-3 px-3">
                        <div className="w-36">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className={`font-bold tabular-nums ${
                              sig.entryProbability.probabilityPct >= 80
                                ? 'text-emerald-400'
                                : sig.entryProbability.probabilityPct >= 70
                                ? 'text-cyan-400'
                                : sig.entryProbability.probabilityPct >= 55
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}>
                              {sig.entryProbability.probabilityPct}%
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap ${
                              sig.entryProbability.confidenceTier === 'ELITE_SNIPER'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                : sig.entryProbability.confidenceTier === 'HIGH_PROBABILITY'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                                : sig.entryProbability.confidenceTier === 'MODERATE'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                            }`}>
                              {lang === 'ar' ? sig.entryProbability.verdictLabelAr : sig.entryProbability.verdictLabelEn}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                sig.entryProbability.probabilityPct >= 80
                                  ? 'bg-emerald-400'
                                  : sig.entryProbability.probabilityPct >= 70
                                  ? 'bg-cyan-400'
                                  : sig.entryProbability.probabilityPct >= 55
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${sig.entryProbability.probabilityPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Confluence Score */}
                      <td className="py-3 px-3">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className={sig.confluenceScore >= 6 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                              {sig.confluenceScore}/{sig.maxScore}
                            </span>
                            <span className="text-[10px] text-slate-500">{scorePct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                sig.confluenceScore >= 7
                                  ? 'bg-emerald-400'
                                  : sig.confluenceScore >= 5
                                  ? 'bg-emerald-600'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Exact Mathematical Limit Entry */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums hidden lg:table-cell">
                        <div className="font-bold text-emerald-400">
                          ${sig.precisionEntry.exact_entry_price < 1 ? sig.precisionEntry.exact_entry_price.toFixed(6) : sig.precisionEntry.exact_entry_price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px] ms-auto">
                          {sig.precisionEntry.entry_mechanism === 'VWAP_ANCHOR_CONFLUENCE' ? 'VWAP Anchor' :
                           sig.precisionEntry.entry_mechanism === 'EMA9_PULLBACK_ANCHOR' ? 'EMA9 Anchor' :
                           sig.precisionEntry.entry_mechanism === 'EMA_CROSS_50PCT_EQUILIBRIUM' ? 'P-Cross 50%' :
                           'OTE 50% Limit'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-400 hidden lg:table-cell">
                        ${sig.precisionEntry.stop_loss_exact < 1 ? sig.precisionEntry.stop_loss_exact.toFixed(6) : sig.precisionEntry.stop_loss_exact.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 hidden lg:table-cell">
                        ${sig.precisionEntry.take_profit_target_1 < 1 ? sig.precisionEntry.take_profit_target_1.toFixed(6) : sig.precisionEntry.take_profit_target_1.toFixed(2)}
                      </td>

                      {/* RR & Order Status */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums">
                        <div className="font-bold text-amber-300">
                          1:{sig.precisionEntry.risk_to_reward_ratio}
                        </div>
                        <div className={`text-[9px] font-bold px-1 py-0.2 rounded inline-block ${
                          sig.precisionEntry.execution_status === 'ACTIVE_LIMIT_ORDER'
                            ? 'bg-emerald-950/60 text-emerald-400'
                            : 'bg-rose-950/60 text-rose-400'
                        }`}>
                          {sig.precisionEntry.execution_status === 'ACTIVE_LIMIT_ORDER' ? 'MAKER' : 'CHASING'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                            title={t.inspectSignal}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onBacktestSymbol(sig.symbol)}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 rounded-md transition-colors flex items-center gap-1"
                            title={t.backtestThis}
                          >
                            <BarChart2 className="w-3 h-3" />
                            <span className="hidden sm:inline">{t.backtestThis}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
