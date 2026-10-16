import React from 'react';
import { translations, Language } from '../i18n/translations';

interface MarketPulseBarProps {
  bullPct: number;
  bearPct: number;
  avgVolume: string;
  confirmedCount: number;
  avgWinProb?: number;
  marketCondition: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  lang: Language;
}

export const MarketPulseBar: React.FC<MarketPulseBarProps> = ({
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Market Condition */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-1">{t.marketCondition}</div>
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
  );
};
