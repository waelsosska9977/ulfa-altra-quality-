import React, { useState, useMemo } from 'react';
import { Search, Eye, ArrowUpRight, ArrowDownRight, BarChart2, Plus, AlertCircle, Sparkles, Zap, Landmark, Target, Layers, Cpu, Building2, TrendingUp, ShieldAlert } from 'lucide-react';
import { SignalAnalysis } from '../types/quant';
import { Language, translations } from '../i18n/translations';
import { BSTOCK_COINS_CATALOG, searchBStockCatalog, getBStockSubSector, TokenCatalogItem } from '../lib/binanceApi';

interface BStockScannerViewProps {
  signals: SignalAnalysis[];
  isLoading: boolean;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  onSelectSignal: (signal: SignalAnalysis) => void;
  onBacktestSymbol: (symbol: string) => void;
  onAddCustomSymbol: (symbol: string) => void;
  onAnalyzeSpecificSymbol: (symbol: string) => void;
  onLoadAllBStocks: () => void;
  lang: Language;
}

export const BStockScannerView: React.FC<BStockScannerViewProps> = ({
  signals,
  isLoading,
  timeframe,
  setTimeframe,
  onSelectSignal,
  onBacktestSymbol,
  onAddCustomSymbol,
  onAnalyzeSpecificSymbol,
  onLoadAllBStocks,
  lang,
}) => {
  const t = translations[lang];
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const timeframes = ['5m', '15m', '1h', '4h', '1d'];

  // All 31 bStocks popular chips for 1-click analysis
  const popularBStocksChips = [
    { sym: 'BBBUSDT', label: 'BlackBerry (BBB)' },
    { sym: 'MDBBUSDT', label: 'MongoDB (MDBB)' },
    { sym: 'PENGBUSDT', label: 'Penguin (PENGB)' },
    { sym: 'UVXYBUSDT', label: 'Ultra VIX (UVXYB)' },
    { sym: 'JPMBUSDT', label: 'JPMorgan (JPMB)' },
    { sym: 'LLYBUSDT', label: 'Eli Lilly (LLYB)' },
    { sym: 'ADBEBUSDT', label: 'Adobe (ADBEB)' },
    { sym: 'NVDBUSD', label: 'Nvidia (NVDB)' },
    { sym: 'TSLABUSD', label: 'Tesla (TSLAB)' },
    { sym: 'AAPLBUSD', label: 'Apple (AAPLB)' },
    { sym: 'MSFTBUSD', label: 'Microsoft (MSFTB)' },
    { sym: 'COINBUSD', label: 'Coinbase (COINB)' },
    { sym: 'CRWDBUSDT', label: 'CrowdStrike (CRWDB)' },
    { sym: 'SMCIBUSDT', label: 'SuperMicro (SMCIB)' },
    { sym: 'PLTRBUSD', label: 'Palantir (PLTRB)' },
    { sym: 'AMZNBUSD', label: 'Amazon (AMZNB)' },
    { sym: 'GOOGBUSD', label: 'Google (GOOGB)' },
    { sym: 'NFLXBUSDT', label: 'Netflix (NFLXB)' },
    { sym: 'DISBUSDT', label: 'Disney (DISB)' },
    { sym: 'AMDBUSDT', label: 'AMD (AMDB)' },
  ];

  // Autocomplete suggestions based on custom input in bStocks catalog
  const catalogSuggestions = useMemo(() => {
    if (!customInput.trim()) return [];
    return searchBStockCatalog(customInput).slice(0, 10);
  }, [customInput]);

  // Fast sector map for all bStocks
  const bStockSectorMap = useMemo(() => {
    const map = new Map<string, string>();
    BSTOCK_COINS_CATALOG.forEach(item => {
      map.set(item.symbol, getBStockSubSector(item.symbol));
    });
    return map;
  }, []);

  // Filter signals strictly within bStocks
  const filteredSignals = signals.filter((sig) => {
    // Search query in active table
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const catalogItem = BSTOCK_COINS_CATALOG.find(c => c.symbol === sig.symbol || c.baseAsset === sig.symbol);
      const name = catalogItem?.name.toLowerCase() || '';
      const base = catalogItem?.baseAsset.toLowerCase() || '';
      const matchesSym = sig.symbol.toLowerCase().includes(q);
      const matchesName = name.includes(q);
      const matchesBase = base.includes(q);
      if (!matchesSym && !matchesName && !matchesBase) return false;
    }

    // Direction and probability filters
    if (sectorFilter === 'LONGS') return sig.direction === 'LONG';
    if (sectorFilter === 'SHORTS') return sig.direction === 'SHORT';
    if (sectorFilter === 'HIGH_PROBABILITY') return sig.entryProbability.probabilityPct >= 75;

    // Sector filters
    if (sectorFilter === 'TECH_AI') {
      return bStockSectorMap.get(sig.symbol) === 'TECH_AI';
    }
    if (sectorFilter === 'FINANCE_RWA') {
      return bStockSectorMap.get(sig.symbol) === 'FINANCE_RWA';
    }
    if (sectorFilter === 'ETF_INDEX') {
      return bStockSectorMap.get(sig.symbol) === 'ETF_INDEX';
    }
    if (sectorFilter === 'MOMENTUM') {
      return bStockSectorMap.get(sig.symbol) === 'MOMENTUM';
    }

    return true;
  });

  const handleInstantAnalyze = (sym: string) => {
    onAnalyzeSpecificSymbol(sym);
    setCustomInput('');
    setShowSuggestions(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      handleInstantAnalyze(customInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Dedicated bStocks Search & Analysis Hub */}
      <div className="bg-gradient-to-r from-[#0c1322] via-[#121c32] to-[#0c1322] border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {t.bStocksScannerTitle}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-200 border border-indigo-700/60 font-semibold">
                {t.bStocksActiveCountBadge}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              {t.bStocksScannerSubtitle}
            </p>
          </div>

          {/* Search Box with Autocomplete & Instant Analyze Action */}
          <div className="relative w-full md:w-auto md:min-w-[400px]">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-indigo-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t.searchBStocksPlaceholder}
                  className="w-full bg-slate-900/95 border border-indigo-900/80 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl transition-colors shrink-0 shadow-lg shadow-indigo-950/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-200" />
                <span>{t.analyzeNowBtn}</span>
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && customInput.trim() && catalogSuggestions.length > 0 && (
              <div className="absolute top-full start-0 end-0 mt-2 bg-slate-900/95 border border-indigo-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                {catalogSuggestions.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => handleInstantAnalyze(item.symbol)}
                    className="p-2.5 hover:bg-indigo-950/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {item.symbol}
                      </span>
                      <span className="text-[11px] text-indigo-300">
                        {item.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                        bStocks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300 text-[11px]">
                        ${item.defaultPrice < 1 ? item.defaultPrice.toFixed(4) : item.defaultPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />
                        <span>{t.analyzeNowBtn}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch Chips for Popular bStocks */}
        <div className="mt-3 pt-3 border-t border-indigo-900/50 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-indigo-300 font-medium me-1 flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'ar' ? 'وصول سريع لأبرز أسهم bStocks:' : 'Quick bStocks Access:'}</span>
          </span>
          {popularBStocksChips.map((chip) => (
            <button
              key={chip.sym}
              onClick={() => handleInstantAnalyze(chip.sym)}
              className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-indigo-950 border border-indigo-900/60 hover:border-indigo-400 text-[11px] font-mono text-indigo-200 hover:text-white transition-all flex items-center gap-1 group cursor-pointer"
              title={`Analyze ${chip.label}`}
            >
              <span className="font-bold text-white group-hover:text-indigo-300">{chip.label}</span>
            </button>
          ))}

          <button
            onClick={onLoadAllBStocks}
            className="ms-auto px-2.5 py-0.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/60 text-[11px] font-bold text-indigo-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>{t.loadAllBStocksBtn}</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Bar: Sector Filters & Timeframe */}
      <div className="bg-[#0e1424]/80 border border-indigo-950 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Active Sector Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setSectorFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                sectorFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAllBStocks}
            </button>
            <button
              onClick={() => setSectorFilter('TECH_AI')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'TECH_AI' ? 'bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>{t.filterBStocksTech}</span>
            </button>
            <button
              onClick={() => setSectorFilter('FINANCE_RWA')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'FINANCE_RWA' ? 'bg-blue-950/80 text-blue-300 font-bold border border-blue-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-400" />
              <span>{t.filterBStocksFinance}</span>
            </button>
            <button
              onClick={() => setSectorFilter('ETF_INDEX')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'ETF_INDEX' ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>{t.filterBStocksEtf}</span>
            </button>
            <button
              onClick={() => setSectorFilter('MOMENTUM')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'MOMENTUM' ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>{t.filterBStocksMomentum}</span>
            </button>
            <button
              onClick={() => setSectorFilter('LONGS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'LONGS' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>{t.filterLongs}</span>
            </button>
            <button
              onClick={() => setSectorFilter('SHORTS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'SHORTS' ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3 h-3 text-rose-400" />
              <span>{t.filterShorts}</span>
            </button>
            <button
              onClick={() => setSectorFilter('HIGH_PROBABILITY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                sectorFilter === 'HIGH_PROBABILITY' ? 'bg-indigo-950/60 text-indigo-300 font-bold border border-indigo-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3 h-3 text-indigo-400" />
              <span>{t.filterHighProbability}</span>
            </button>
          </div>

          {/* Timeframe & Table Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'تصفية الأسهم المرمزة...' : 'Filter bStocks table...'}
                className="bg-slate-900 border border-slate-700/80 rounded-lg ps-8 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. bStocks Signals Table */}
      <div className="bg-[#0e1424]/90 border border-indigo-950/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-indigo-950 bg-slate-900/70 text-slate-400 text-[11px] font-semibold">
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
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">{t.loadingAnalysis}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs text-slate-300">
                        {lang === 'ar'
                          ? 'جاري تحميل أسهم bStocks أو لا توجد نتائج مطابقة. اضغط أدناه لتحميل جميع الـ 31 سهم فوراً:'
                          : 'Loading bStocks or no matching symbols. Click below to load all 31 bStocks:'}
                      </span>
                      <button
                        onClick={onLoadAllBStocks}
                        className="mt-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{t.loadAllBStocksBtn}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isLong = sig.direction === 'LONG';
                  const isShort = sig.direction === 'SHORT';
                  const isPositiveChange = sig.change24h >= 0;
                  const scorePct = (sig.confluenceScore / sig.maxScore) * 100;
                  const catalogItem = BSTOCK_COINS_CATALOG.find(c => c.symbol === sig.symbol || c.baseAsset === sig.symbol);

                  return (
                    <tr
                      key={sig.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Symbol & Company Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="font-mono font-bold text-white text-sm hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{sig.symbol}</span>
                          </button>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                            <Landmark className="w-2.5 h-2.5 text-indigo-400" />
                            <span>bStocks</span>
                          </span>
                        </div>
                        {catalogItem && (
                          <div className="text-[11px] text-slate-300 font-medium truncate max-w-[210px]">
                            {catalogItem.name}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono">
                          Vol: ${(sig.volume24hUsdt / 1_000_000).toFixed(1)}M USDT
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 font-semibold">
                        ${sig.currentPrice < 1 ? sig.currentPrice.toFixed(4) : sig.currentPrice.toFixed(2)}
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
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isLong
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isShort
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : isShort ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                          <span>{sig.direction}</span>
                        </span>
                      </td>

                      {/* Win Probability % */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className={
                              sig.entryProbability.probabilityPct >= 75
                                ? 'text-emerald-400'
                                : sig.entryProbability.probabilityPct >= 65
                                ? 'text-cyan-400'
                                : 'text-slate-300'
                            }>
                              {sig.entryProbability.probabilityPct}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {sig.entryProbability.confidenceTier === 'ELITE_SNIPER'
                                ? (lang === 'ar' ? 'فائق' : 'Prime')
                                : sig.entryProbability.confidenceTier === 'HIGH_PROBABILITY'
                                ? (lang === 'ar' ? 'مؤكد' : 'Valid')
                                : (lang === 'ar' ? 'معتدل' : 'Moderate')}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                sig.entryProbability.probabilityPct >= 75
                                  ? 'bg-emerald-500'
                                  : sig.entryProbability.probabilityPct >= 65
                                  ? 'bg-cyan-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${sig.entryProbability.probabilityPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Confluence Score */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white font-bold">{sig.confluenceScore}</span>
                            <span className="text-slate-500">/{sig.maxScore}</span>
                          </div>
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                sig.confluenceScore >= 7
                                  ? 'bg-emerald-500'
                                  : sig.confluenceScore >= 5
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Entry Price */}
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-slate-300 hidden lg:table-cell">
                        ${sig.precisionEntry.exact_entry_price < 1
                          ? sig.precisionEntry.exact_entry_price.toFixed(4)
                          : sig.precisionEntry.exact_entry_price.toFixed(2)}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-rose-400 hidden lg:table-cell">
                        ${sig.stopLoss < 1 ? sig.stopLoss.toFixed(4) : sig.stopLoss.toFixed(2)}
                      </td>

                      {/* Take Profit */}
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-emerald-400 hidden lg:table-cell">
                        ${sig.takeProfit1 < 1 ? sig.takeProfit1.toFixed(4) : sig.takeProfit1.toFixed(2)}
                      </td>

                      {/* Risk / Reward */}
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold tabular-nums text-slate-200">
                        1:{sig.riskRewardRatio.toFixed(1)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                          </button>
                          <button
                            onClick={() => onBacktestSymbol(sig.symbol)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            title={t.runBacktestBtn}
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden xl:inline">{lang === 'ar' ? 'باك تيست' : 'Backtest'}</span>
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
