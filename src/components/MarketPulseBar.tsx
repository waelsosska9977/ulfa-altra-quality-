import React from 'react';
import { Landmark, Coins, TrendingUp, Activity } from 'lucide-react';
import { translations, Language } from '../i18n/translations';

interface MarketPulseBarProps {
  marketTitle?: string;
  badgeLabel?: string;
  isBStocks?: boolean;
  bullPct: number;
  bearPct: number;
  avgVolume: string;
  confirmedCount: number;
  avgWinProb?: number;
  marketCondition: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  lang: Language;
}

export const MarketPulseBar: React.FC<MarketPulseBarProps> = ({
  marketTitle,
  badgeLabel,
  isBStocks = false,
  bullPct,
  bearPct,
  avgVolume,
  confirmedCount,
  avgWinProb = 74.8,
  marketCondition,
  lang,
}) => {
  const t = translations[lang];

  const conditionText =
    marketCondition === 'BULLISH'
      ? t.marketConditionBullish
      : marketCondition === 'BEARISH'
      ? t.marketConditionBearish
      : t.marketConditionNeutral;

  const conditionColor =
    marketCondition === 'BULLISH'
      ? 'text-emerald-400'
      : marketCondition === 'BEARISH'
      ? 'text-rose-400'
      : 'text-amber-400';

  const defaultTitle = isBStocks
    ? t.bStocksPulseTitle
    : t.cryptoPulseTitle;

  const defaultBadge = isBStocks
    ? (lang === 'ar' ? 'وول ستريت بينانس' : 'Wall Street bStocks')
    : (lang === 'ar' ? 'بينانس فيوتشر وسبوت' : 'Binance Crypto Futures');

  return (
    <div className="space-y-2">
      {/* Section Header Identification */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg border ${
            isBStocks
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {isBStocks ? <Landmark className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
          </span>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {marketTitle || defaultTitle}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
            isBStocks
              ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
          }`}>
            {badgeLabel || defaultBadge}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
          {isBStocks ? (lang === 'ar' ? 'تحليل مستقل لأسهم bStocks' : 'Isolated bStocks Analytics') : (lang === 'ar' ? 'تحليل مستقل للعملات المشفرة' : 'Isolated Crypto Analytics')}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Market Condition */}
        <div className={`border rounded-xl p-4 ${
          isBStocks ? 'bg-[#0e1526]/80 border-indigo-900/40' : 'bg-[#0f172a]/70 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 mb-1">{isBStocks ? t.bStocksMarketCondition : t.cryptoMarketCondition}</div>
          <div className={`text-base font-bold ${conditionColor}`}>{conditionText}</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-EMA & VWAP Anchor</div>
        </div>

      {/* 2. 24h Avg Volume */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">{t.avgVolume24h}</div>
        <div className="text-base font-bold font-mono tabular-nums text-white">{avgVolume}</div>
        <div className="text-[11px] text-slate-500 mt-1">USDT Equivalent</div>
      </div>

      {/* 3. Confirmed Signals */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">{t.confirmedSignals}</div>
        <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
          {confirmedCount} <span className="text-xs font-normal text-slate-400">/ 8 Factors</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Ultra Confluence Threshold</div>
      </div>

      {/* 4. Average Entry Win Probability */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">{t.winProbability}</div>
        <div className="text-base font-bold font-mono tabular-nums text-cyan-400">
          {avgWinProb.toFixed(1)}%
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Mathematical Quality Score</div>
      </div>

      {/* 5. Market Pulse Balance Bar */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1 lg:col-span-1">
        <div className="text-xs text-slate-400 mb-1">{t.marketPulse}</div>
        <div className="flex items-center justify-between text-xs font-mono font-semibold">
          <span className="text-emerald-400">{t.bullRatio}: {bullPct}%</span>
          <span className="text-rose-400">{t.bearRatio}: {bearPct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${bullPct}%` }}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${bearPct}%` }}
          />
        </div>
      </div>
    </div>
  </div>
  );
};
