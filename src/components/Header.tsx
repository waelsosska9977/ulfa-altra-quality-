import React from 'react';
import { Activity, Code, BarChart2, Globe, RefreshCw, ShieldCheck, Landmark, Coins } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

export type MainTab = 'crypto' | 'bstocks' | 'backtest' | 'generator';

interface HeaderProps {
  currentTab: MainTab;
  setTab: (tab: MainTab) => void;
  lang: Language;
  toggleLang: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  onOpenGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  lang,
  toggleLang,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenGuide,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/95 backdrop-blur sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Single text wordmark brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              {t.appTitle}
            </div>
            <div className="text-xs text-slate-400 hidden sm:block whitespace-nowrap">
              {t.appSubtitle}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation links - Independent Crypto, bStocks, Backtest, Generator */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {/* 1. Crypto Tab */}
          <button
            onClick={() => setTab('crypto')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'crypto'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>{t.cryptoTab}</span>
          </button>

          {/* 2. bStocks Tab */}
          <button
            onClick={() => setTab('bstocks')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'bstocks'
                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-4 h-4 text-indigo-400" />
            <span>{t.bStocksTab}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono font-bold">
              31
            </span>
          </button>

          {/* 3. Backtester Tab */}
          <button
            onClick={() => setTab('backtest')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'backtest'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>{t.backtestTab}</span>
          </button>

          {/* 4. Python Generator Tab */}
          <button
            onClick={() => setTab('generator')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'generator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-4 h-4 text-amber-400" />
            <span>{t.generatorTab}</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <span>{t.liveUpdate}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono text-slate-300">{lastUpdated || '—'}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={t.refreshNow}
            className="p-2 text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-lg transition-colors flex items-center justify-center shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              title={lang === 'ar' ? 'دليل اختبار الاستراتيجية قبل المال الحقيقي' : 'How to test strategy before real money'}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'دليل الاختبار' : 'Testing Guide'}</span>
            </button>
          )}

          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
