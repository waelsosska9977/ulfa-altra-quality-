import React, { useState, useMemo } from 'react';
import { 
  Search, Eye, ArrowUpRight, ArrowDownRight, BarChart2, Plus, AlertCircle, 
  Sparkles, Zap, Flame, Bot, Layers, Coins, Landmark, Target, Shield, 
  Gamepad2, Database, TrendingUp, TrendingDown, Play, Square 
} from 'lucide-react';
import { SignalAnalysis } from '../types/quant';
import { Language, translations } from '../i18n/translations';
import { searchCryptoCatalog, TokenCatalogItem, TokenCategory, CRYPTO_COINS_CATALOG } from '../lib/binanceApi';

interface ScannerViewProps {
  signals: SignalAnalysis[];
  isLoading: boolean;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  onSelectSignal: (signal: SignalAnalysis) => void;
  onBacktestSymbol: (symbol: string) => void;
  onAddCustomSymbol: (symbol: string) => void;
  onAnalyzeSpecificSymbol: (symbol: string) => void;
  onLoadCategorySymbols?: (symbols: string[]) => void;
  onSwitchToBStocks?: () => void;
  lang: Language;
  totalFuturesCount?: number;
  scanProgress?: { current: number; total: number; isScanning: boolean } | null;
  onStopScan?: () => void;
  onScanBatch?: (type: 'TOP25' | 'TOP50' | 'TOP100' | 'ALL') => void;
  allFuturesList?: TokenCatalogItem[];
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  signals,
  isLoading,
  timeframe,
  setTimeframe,
  onSelectSignal,
  onBacktestSymbol,
  onAddCustomSymbol,
  onAnalyzeSpecificSymbol,
  onLoadCategorySymbols,
  onSwitchToBStocks,
  lang,
  totalFuturesCount = 525,
  scanProgress,
  onStopScan,
  onScanBatch,
  allFuturesList = [],
}) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const timeframes = ['5m', '15m', '1h', '4h', '1d'];

  // Popular Trending Futures Chips for 1-click instant analysis
  const trendingChips = [
    { sym: 'BTCUSDT', label: 'BTC', cat: 'TOP_FUTURES' },
    { sym: 'ETHUSDT', label: 'ETH', cat: 'TOP_FUTURES' },
    { sym: 'SOLUSDT', label: 'SOL', cat: 'TOP_FUTURES' },
    { sym: 'DOGEUSDT', label: 'DOGE', cat: 'MEME' },
    { sym: '1000PEPEUSDT', label: 'PEPE 1000x', cat: 'MEME' },
    { sym: 'SUIUSDT', label: 'SUI', cat: 'LAYER1_2' },
    { sym: 'TAOUSDT', label: 'TAO', cat: 'AI_DEPIN' },
    { sym: 'RENDERUSDT', label: 'RENDER', cat: 'AI_DEPIN' },
    { sym: 'NEARUSDT', label: 'NEAR', cat: 'AI_DEPIN' },
    { sym: 'WIFUSDT', label: 'WIF', cat: 'MEME' },
    { sym: '1000BONKUSDT', label: 'BONK 1000x', cat: 'MEME' },
    { sym: '1000SHIBUSDT', label: 'SHIB 1000x', cat: 'MEME' },
    { sym: 'PNUTUSDT', label: 'PNUT', cat: 'MEME' },
    { sym: 'GOATUSDT', label: 'GOAT', cat: 'MEME' },
    { sym: 'SEIUSDT', label: 'SEI', cat: 'LAYER1_2' },
    { sym: 'APTUSDT', label: 'APT', cat: 'LAYER1_2' },
    { sym: 'ONDOUSDT', label: 'ONDO', cat: 'RWA' },
    { sym: 'AAVEUSDT', label: 'AAVE', cat: 'DEFI' },
    { sym: 'UNIUSDT', label: 'UNI', cat: 'DEFI' },
    { sym: 'GALAUSDT', label: 'GALA', cat: 'GAMING' },
  ];

  // Dynamic Autocomplete across ALL 525+ available Binance Futures contracts
  const catalogSuggestions = useMemo(() => {
    if (!customInput.trim()) return [];
    return searchCryptoCatalog(customInput).slice(0, 12);
  }, [customInput]);

  // Symbol category map for fast lookup
  const symbolCatalogMap = useMemo(() => {
    const map = new Map<string, TokenCatalogItem>();
    CRYPTO_COINS_CATALOG.forEach(item => {
      map.set(item.symbol, item);
    });
    allFuturesList.forEach(item => {
      map.set(item.symbol, item);
    });
    return map;
  }, [allFuturesList]);

  // Filter signals strictly within Cryptocurrency Futures
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      // Search query in active table
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const catalogItem = symbolCatalogMap.get(sig.symbol);
        const name = catalogItem?.name.toLowerCase() || '';
        const base = catalogItem?.baseAsset.toLowerCase() || '';
        const matchesSym = sig.symbol.toLowerCase().includes(q);
        const matchesName = name.includes(q);
        const matchesBase = base.includes(q);
        if (!matchesSym && !matchesName && !matchesBase) return false;
      }

      // Direction & confluence filters
      if (filter === 'LONGS') return sig.direction === 'LONG';
      if (filter === 'SHORTS') return sig.direction === 'SHORT';
      if (filter === 'HIGH_CONFLUENCE') return sig.confluenceScore >= 7;
      if (filter === 'HIGH_PROBABILITY') return sig.entryProbability.probabilityPct >= 75;
      
      // Category sector filters
      const item = symbolCatalogMap.get(sig.symbol);
      const cat = item?.category;

      if (filter === 'TOP_FUTURES') {
        return cat === 'TOP_FUTURES' || sig.volume24hUsdt > 150_000_000;
      }
      if (filter === 'AI_DEPIN') return cat === 'AI_DEPIN';
      if (filter === 'MEME') return cat === 'MEME';
      if (filter === 'LAYER1_2') return cat === 'LAYER1_2';
      if (filter === 'DEFI') return cat === 'DEFI';
      if (filter === 'RWA') return cat === 'RWA';
      if (filter === 'GAMING') return cat === 'GAMING';
      if (filter === 'GAINERS') return sig.change24h > 2.0;
      if (filter === 'LOSERS') return sig.change24h < -2.0;

      return true;
    });
  }, [signals, searchQuery, filter, symbolCatalogMap]);

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

  const handleLoadCategory = (cat: string) => {
    if (onLoadCategorySymbols && allFuturesList.length > 0) {
      if (cat === 'ALL') {
        // Load default active set
      } else {
        const symbolsInCat = allFuturesList
          .filter(c => c.category === cat)
          .map(c => c.symbol);
        if (symbolsInCat.length > 0) {
          onLoadCategorySymbols(symbolsInCat);
        }
      }
    }
    setFilter(cat);
  };

  return (
    <div className="space-y-4">
      {/* 1. Universal Dynamic Binance Futures Header & Search Hub */}
      <div className="bg-gradient-to-r from-[#0a1120] via-[#101b33] to-[#0a1120] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {lang === 'ar' ? 'الماسح الفوري لكافة عقود فيوتشر بينانس المرمزة (USDT-M Futures)' : 'Binance Tokenized USDT Futures Live Scanner'}
              </h2>
              {/* Unlimited Universe Badge */}
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{totalFuturesCount || 525}+ {lang === 'ar' ? 'عقد فيوتشر متاح (غير مقيد)' : 'Live Futures (Unlimited)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'ar' 
                ? 'فحص ومسح حي ديناميكي لكافة العملات المرمزة وعقود الفيوتشر المتاحة في بينانس بدقة خوارزمية دون التقيد بعدد محدد' 
                : 'Dynamic live scanning across all available tokenized futures contracts on Binance without fixed limit'}
            </p>
          </div>

          {/* Search Box with Autocomplete Across all 525+ Futures */}
          <div className="relative w-full md:w-auto md:min-w-[400px]">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={lang === 'ar' ? 'ابحث في كافة عقود الفيوتشر (مثال: PEPE, 1000BONK, SUI, DOGE, TAO)...' : 'Search any futures contract (e.g. 1000PEPE, SUI, TAO, DOGE)...'}
                  className="w-full bg-slate-900/95 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-xl transition-colors shrink-0 shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.analyzeNowBtn}</span>
              </button>
            </form>

            {/* Suggestions Dropdown for 525+ symbols */}
            {showSuggestions && customInput.trim() && catalogSuggestions.length > 0 && (
              <div className="absolute top-full start-0 end-0 mt-2 bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-80 overflow-y-auto">
                {catalogSuggestions.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => handleInstantAnalyze(item.symbol)}
                    className="p-2.5 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {item.symbol}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {item.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        item.category === 'MEME' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                        item.category === 'AI_DEPIN' ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60' :
                        item.category === 'LAYER1_2' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' :
                        item.category === 'RWA' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' :
                        item.category === 'GAMING' ? 'bg-pink-950/80 text-pink-300 border border-pink-800/60' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
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

        {/* Quick Batch Scanning Options */}
        {onScanBatch && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'ar' ? 'خيارات الفحص الشامل:' : 'Universe Scanning Options:'}</span>
              </span>

              <button
                onClick={() => onScanBatch('TOP25')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {t.scanTop25Btn}
              </button>

              <button
                onClick={() => onScanBatch('TOP50')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {t.scanTop50Btn}
              </button>

              <button
                onClick={() => onScanBatch('TOP100')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {t.scanTop100Btn}
              </button>

              <button
                onClick={() => onScanBatch('ALL')}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.scanAllFuturesBtn}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              <span>{lang === 'ar' ? 'العقود المفحوصة حالياً:' : 'Scanned Active:'} </span>
              <span className="text-emerald-400 font-bold">{signals.length}</span>
              <span> / {totalFuturesCount || 525}</span>
            </div>
          </div>
        )}

        {/* Live Batch Scanning Progress Bar */}
        {scanProgress?.isScanning && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>{t.scanningProgress} ({scanProgress.current} / {scanProgress.total})</span>
                </span>
                <span className="text-white font-mono font-bold">
                  {Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {onStopScan && (
              <button
                onClick={onStopScan}
                className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-200 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>{t.stopScanBtn}</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Launch Chips for Top Futures */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium me-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.quickAnalyzeTokens}</span>
          </span>
          {trendingChips.map((chip) => (
            <button
              key={chip.sym}
              onClick={() => handleInstantAnalyze(chip.sym)}
              className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 text-[11px] font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1 group cursor-pointer"
              title={`Analyze ${chip.sym}`}
            >
              <span className="font-bold text-white group-hover:text-emerald-400">{chip.label}</span>
              <span className="text-[9px] text-slate-500 font-sans">
                {chip.cat === 'MEME' ? '🐸' : chip.cat === 'AI_DEPIN' ? '🤖' : chip.cat === 'RWA' ? '💎' : '⚡'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Link to Dedicated bStocks Section */}
      {onSwitchToBStocks && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Landmark className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{lang === 'ar' ? 'قسم أسهم bStocks المرمزة متاح كقسم مستقل منفصل تماماً' : 'bStocks Equities Section is available as an independent module'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono font-bold">31 سهم</span>
              </div>
              <div className="text-[11px] text-indigo-200/70">
                {lang === 'ar' ? 'تحليل ومسح خاص لأسهم الشركات العالمية المرمزة (BlackBerry, MongoDB, Apple, Tesla, Nvidia, JPMorgan...)' : 'Dedicated scanner & pulse for global tokenized equities'}
              </div>
            </div>
          </div>
          <button
            onClick={onSwitchToBStocks}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-950/60 cursor-pointer text-xs"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الانتقال إلى ماسح أسهم bStocks 🏛️' : 'Go to bStocks Scanner 🏛️'}</span>
          </button>
        </div>
      )}

      {/* 2. Controls Bar: Table Filters, Category Navigation & Timeframe Selector */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Active Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'ALL' ? 'bg-slate-800 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll} ({signals.length})
            </button>
            <button
              onClick={() => handleLoadCategory('TOP_FUTURES')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'TOP_FUTURES' ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{t.filterTopFutures}</span>
            </button>
            <button
              onClick={() => setFilter('LONGS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'LONGS' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>{t.filterLongs}</span>
            </button>
            <button
              onClick={() => setFilter('SHORTS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'SHORTS' ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3 h-3 text-rose-400" />
              <span>{t.filterShorts}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('AI_DEPIN')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'AI_DEPIN' ? 'bg-purple-950/60 text-purple-300 font-bold border border-purple-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3 text-purple-400" />
              <span>{t.filterAiDepin}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('MEME')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'MEME' ? 'bg-yellow-950/60 text-yellow-300 font-bold border border-yellow-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3 h-3 text-yellow-400" />
              <span>{t.filterMeme}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('LAYER1_2')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'LAYER1_2' ? 'bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>{t.filterLayer1}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('DEFI')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'DEFI' ? 'bg-blue-950/60 text-blue-300 font-bold border border-blue-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Landmark className="w-3 h-3 text-blue-400" />
              <span>{t.filterDefi}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('RWA')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'RWA' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{t.filterRwa}</span>
            </button>
            <button
              onClick={() => handleLoadCategory('GAMING')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'GAMING' ? 'bg-pink-950/60 text-pink-300 font-bold border border-pink-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3 h-3 text-pink-400" />
              <span>{t.filterGaming}</span>
            </button>
            <button
              onClick={() => setFilter('HIGH_PROBABILITY')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'HIGH_PROBABILITY' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3 h-3 text-emerald-400" />
              <span>{t.filterHighProbability}</span>
            </button>
          </div>

          {/* Table search filter & Timeframe selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'تصفية الجدول...' : 'Filter table...'}
                className="w-32 sm:w-40 bg-slate-900 border border-slate-700/80 rounded-lg ps-8 pe-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
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
      </div>

      {/* 3. Main Quantitative Table */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
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
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">{t.loadingAnalysis}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="w-5 h-5 text-slate-500" />
                      <span>{lang === 'ar' ? 'لا توجد عملات مطابقة للتصفية الحالية. استخدم أزرار الفحص السريع أعلاه أو شريط البحث.' : 'No contracts match the current filter. Use universe scanning options above or the search bar.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isLong = sig.direction === 'LONG';
                  const isShort = sig.direction === 'SHORT';
                  const isPositiveChange = sig.change24h >= 0;
                  const scorePct = (sig.confluenceScore / sig.maxScore) * 100;
                  const catalogItem = symbolCatalogMap.get(sig.symbol);

                  return (
                    <tr
                      key={sig.symbol}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Symbol & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="font-mono font-bold text-white text-sm hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{sig.symbol}</span>
                          </button>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            {lang === 'ar' ? 'عقد دائم' : 'PERP'}
                          </span>
                        </div>
                        {catalogItem && (
                          <div className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]">
                            {catalogItem.name}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono">
                          Vol: ${(sig.volume24hUsdt / 1_000_000).toFixed(1)}M USDT
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 font-semibold">
                        ${sig.currentPrice < 0.001 ? sig.currentPrice.toFixed(8) : sig.currentPrice < 1 ? sig.currentPrice.toFixed(4) : sig.currentPrice.toFixed(2)}
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
                                sig.confluenceScore >= 6
                                  ? 'bg-emerald-500'
                                  : sig.confluenceScore >= 4
                                  ? 'bg-amber-500'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${scorePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Exact Limit Entry */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300 hidden lg:table-cell">
                        ${sig.precisionEntry.exact_entry_price < 0.001 
                          ? sig.precisionEntry.exact_entry_price.toFixed(8) 
                          : sig.precisionEntry.exact_entry_price < 1 
                          ? sig.precisionEntry.exact_entry_price.toFixed(4) 
                          : sig.precisionEntry.exact_entry_price.toFixed(2)}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-400/90 hidden lg:table-cell">
                        ${sig.stopLoss < 0.001 ? sig.stopLoss.toFixed(8) : sig.stopLoss < 1 ? sig.stopLoss.toFixed(4) : sig.stopLoss.toFixed(2)}
                      </td>

                      {/* Take Profit Target 1 */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400/90 hidden lg:table-cell">
                        ${sig.takeProfit1 < 0.001 ? sig.takeProfit1.toFixed(8) : sig.takeProfit1 < 1 ? sig.takeProfit1.toFixed(4) : sig.takeProfit1.toFixed(2)}
                      </td>

                      {/* Risk / Reward */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-300 font-medium">
                        1:{sig.riskRewardRatio.toFixed(1)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title={t.inspectSignal}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onBacktestSymbol(sig.symbol)}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                            title={t.backtestThis}
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
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
