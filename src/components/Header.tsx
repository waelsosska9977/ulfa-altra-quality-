import React from 'react';
import { Activity, Code, BarChart2, Globe, RefreshCw } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  currentTab: 'scanner' | 'backtest' | 'generator';
  setTab: (tab: 'scanner' | 'backtest' | 'generator') => void;
  lang: Language;
  toggleLang: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  lang,
  toggleLang,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
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

        {/* Zone 2: Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setTab('scanner')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentTab === 'scanner'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.scannerTab}</span>
          </button>

          <button
            onClick={() => setTab('backtest')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentTab === 'backtest'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{t.backtestTab}</span>
          </button>

          <button
            onClick={() => setTab('generator')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentTab === 'generator'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-4 h-4" />
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
