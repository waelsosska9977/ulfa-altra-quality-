import React, { useState } from 'react';
import { Play, Sliders, Shield, AlertTriangle, CheckCircle, BarChart3, TrendingUp, Info } from 'lucide-react';
import { Candle, BacktestConfig, BacktestResult } from '../types/quant';
import { ChartViewer } from './ChartViewer';
import { EquityChart } from './EquityChart';
import { TradeLogTable } from './TradeLogTable';
import { Language, translations } from '../i18n/translations';

interface BacktesterViewProps {
  candles: Candle[];
  config: BacktestConfig;
  setConfig: React.Dispatch<React.SetStateAction<BacktestConfig>>;
  result: BacktestResult | null;
  onRunBacktest: () => void;
  isRunning: boolean;
  lang: Language;
}

export const BacktesterView: React.FC<BacktesterViewProps> = ({
  candles,
  config,
  setConfig,
  result,
  onRunBacktest,
  isRunning,
  lang,
}) => {
  const t = translations[lang];
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presets = [
    { name: 'Ultra Alpha Confluence (Sosska v3)', minConf: 6, atrSL: 1.5, atrTP: 3.0 },
    { name: 'Strict High-Conviction (7/8)', minConf: 7, atrSL: 1.2, atrTP: 2.8 },
    { name: 'Aggressive Momentum Swing', minConf: 5, atrSL: 1.8, atrTP: 3.5 },
  ];

  return (
    <div className="space-y-5">
      {/* Configuration Header & Parameters Panel */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>{t.backtestHeader}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {t.backtestDescription}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Controls' : 'Tune Parameters'}</span>
            </button>

            <button
              onClick={onRunBacktest}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? t.backtestRunning : t.runBacktestBtn}</span>
            </button>
          </div>
        </div>

        {/* Quick Strategy Presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setConfig((prev) => ({
                  ...prev,
                  minConfluence: p.minConf,
                  atrMultiplierSL: p.atrSL,
                  atrMultiplierTP: p.atrTP,
                }));
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                config.minConfluence === p.minConf
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Essential Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
          {/* Symbol */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">{t.symbol}</label>
            <input
              type="text"
              value={config.symbol}
              onChange={(e) => setConfig((prev) => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">{t.timeframe}</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig((prev) => ({ ...prev, timeframe: e.target.value }))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            >
              {['5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Direction Mode */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">{t.directionModeLabel}</label>
            <select
              value={config.directionMode}
              onChange={(e) => setConfig((prev) => ({ ...prev, directionMode: e.target.value as any }))}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="BOTH">{t.directionBoth}</option>
              <option value="LONG_ONLY">{t.directionLongOnly}</option>
              <option value="SHORT_ONLY">{t.directionShortOnly}</option>
            </select>
          </div>

          {/* Confluence Threshold */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.minConfluenceLabel}: <span className="text-emerald-400 font-bold">{config.minConfluence} / 8</span>
            </label>
            <input
              type="range"
              min={4}
              max={8}
              step={1}
              value={config.minConfluence}
              onChange={(e) => setConfig((prev) => ({ ...prev, minConfluence: Number(e.target.value) }))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Mandatory Train/Test Split & Fee Policies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
          {/* Train/Test Split (Rule 3) */}
          <div className="md:col-span-1 p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">{t.trainRatioLabel}</span>
              <span className="font-mono text-emerald-400 font-bold">
                {(config.trainRatio * 100).toFixed(0)}% Train / {((1 - config.trainRatio) * 100).toFixed(0)}% Test
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.85}
              step={0.05}
              value={config.trainRatio}
              onChange={(e) => setConfig((prev) => ({ ...prev, trainRatio: Number(e.target.value) }))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[10px] text-slate-500">
              Mandated split to audit out-of-sample statistical robustness.
            </div>
          </div>

          {/* Fee Policy (Rule 2) */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.feePolicyLabel}</span>
            </div>
            <div className="font-mono text-xs text-white font-bold tabular-nums">
              {(config.feeRate * 100).toFixed(2)}% per transaction
            </div>
            <div className="text-[10px] text-slate-500">
              Locked to Binance VIP0 standard taker commission (0.0006).
            </div>
          </div>

          {/* Slippage Policy (Rule 2) */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.slippagePolicyLabel}</span>
            </div>
            <div className="font-mono text-xs text-white font-bold tabular-nums">
              {(config.slippageRate * 100).toFixed(2)}% per execution
            </div>
            <div className="text-[10px] text-slate-500">
              Simulates realistic order-book impact & spread crossing.
            </div>
          </div>
        </div>

        {/* Advanced parameters collapsible */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t.initialCapitalLabel}</label>
              <input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig((prev) => ({ ...prev, initialCapital: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">ATR Stop Loss Multiplier</label>
              <input
                type="number"
                step={0.1}
                value={config.atrMultiplierSL}
                onChange={(e) => setConfig((prev) => ({ ...prev, atrMultiplierSL: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">ATR Take Profit Multiplier</label>
              <input
                type="number"
                step={0.1}
                value={config.atrMultiplierTP}
                onChange={(e) => setConfig((prev) => ({ ...prev, atrMultiplierTP: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t.barsCountLabel}</label>
              <input
                type="number"
                value={config.candleLimit}
                onChange={(e) => setConfig((prev) => ({ ...prev, candleLimit: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 font-mono text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Backtest Results Section */}
      {result && (
        <div className="space-y-5">
          {/* Overfitting Audit Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            result.overfittingStatus === 'ROBUST'
              ? 'bg-emerald-950/20 border-emerald-800/50'
              : result.overfittingStatus === 'MODERATE_DEGRADATION'
              ? 'bg-amber-950/20 border-amber-800/50'
              : 'bg-rose-950/20 border-rose-800/50'
          }`}>
            <div className="flex items-center gap-3">
              {result.overfittingStatus === 'ROBUST' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-white">
                  {t.overfittingCheck}:{' '}
                  <span className="font-mono">
                    Sharpe OOS / IS = {result.overfittingRatio}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {result.overfittingStatus === 'ROBUST'
                    ? t.statusRobust
                    : result.overfittingStatus === 'MODERATE_DEGRADATION'
                    ? t.statusModerate
                    : t.statusSevere}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div>
                <span className="text-slate-500">Benchmark B&H: </span>
                <span className={`font-bold ${result.benchmarkReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.benchmarkReturnPct >= 0 ? '+' : ''}{result.benchmarkReturnPct}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Alpha: </span>
                <span className={`font-bold ${result.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.alpha >= 0 ? '+' : ''}{result.alpha}%
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side In-Sample vs Out-of-Sample Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* In-Sample (Train) Card */}
            <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {t.inSampleCard}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {result.inSampleMetrics.totalTrades} Trades
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricTotalReturn}</div>
                  <div className={`font-mono text-sm font-bold tabular-nums ${
                    result.inSampleMetrics.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {result.inSampleMetrics.totalReturnPct >= 0 ? '+' : ''}{result.inSampleMetrics.totalReturnPct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricSharpe}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-white">
                    {result.inSampleMetrics.sharpeRatio}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricWinRate}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-emerald-400">
                    {result.inSampleMetrics.winRatePct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricMaxDD}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-rose-400">
                    -{result.inSampleMetrics.maxDrawdownPct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricProfitFactor}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-amber-300">
                    {result.inSampleMetrics.profitFactor}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricFeesPaid}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-slate-300">
                    ${result.inSampleMetrics.totalFeesPaid}
                  </div>
                </div>
              </div>
            </div>

            {/* Out-of-Sample (Test) Card */}
            <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {t.outOfSampleCard}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {result.outOfSampleMetrics.totalTrades} Trades
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricTotalReturn}</div>
                  <div className={`font-mono text-sm font-bold tabular-nums ${
                    result.outOfSampleMetrics.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {result.outOfSampleMetrics.totalReturnPct >= 0 ? '+' : ''}{result.outOfSampleMetrics.totalReturnPct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricSharpe}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-white">
                    {result.outOfSampleMetrics.sharpeRatio}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricWinRate}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-emerald-400">
                    {result.outOfSampleMetrics.winRatePct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricMaxDD}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-rose-400">
                    -{result.outOfSampleMetrics.maxDrawdownPct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricProfitFactor}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-amber-300">
                    {result.outOfSampleMetrics.profitFactor}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">{t.metricFeesPaid}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-slate-300">
                    ${result.outOfSampleMetrics.totalFeesPaid}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Chart (With Train/Test Split Divider) */}
          <EquityChart result={result} lang={lang} />

          {/* Candlestick & Indicator Technical Chart */}
          <ChartViewer
            symbol={config.symbol}
            timeframe={config.timeframe}
            candles={candles}
            entryPrice={result.trades[result.trades.length - 1]?.entryPrice}
            stopLoss={result.trades[result.trades.length - 1] ? (result.trades[result.trades.length - 1].direction === 'LONG' ? result.trades[result.trades.length - 1].entryPrice * 0.98 : result.trades[result.trades.length - 1].entryPrice * 1.02) : undefined}
            takeProfit={result.trades[result.trades.length - 1] ? (result.trades[result.trades.length - 1].direction === 'LONG' ? result.trades[result.trades.length - 1].entryPrice * 1.04 : result.trades[result.trades.length - 1].entryPrice * 0.96) : undefined}
          />

          {/* Executed Trades Table */}
          <TradeLogTable
            trades={result.trades}
            symbol={config.symbol}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
};
