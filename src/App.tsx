import { useState, useEffect, useCallback, useRef } from 'react';
import { Header, MainTab } from './components/Header';
import { MarketPulseBar } from './components/MarketPulseBar';
import { ScannerView } from './components/ScannerView';
import { BStockScannerView } from './components/BStockScannerView';
import { ConfluenceModal } from './components/ConfluenceModal';
import { BacktesterView } from './components/BacktesterView';
import { PythonCodeGenerator } from './components/PythonCodeGenerator';
import { StrategyTestingGuideModal } from './components/StrategyTestingGuideModal';
import { Language, translations } from './i18n/translations';
import { SignalAnalysis, BacktestConfig, BacktestResult, Candle } from './types/quant';
import {
  fetch24hTickers,
  fetchKlines,
  DEFAULT_CRYPTO_WATCHLIST,
  DEFAULT_BSTOCK_WATCHLIST,
  normalizeSymbol,
  CRYPTO_COINS_CATALOG,
  BSTOCK_COINS_CATALOG,
  loadAllBinanceFuturesTokens,
  TokenCatalogItem
} from './lib/binanceApi';
import { SEEDED_BINANCE_FUTURES } from './lib/futuresUniverse';
import { evaluateConfluence } from './lib/indicators';
import { runVectorizedBacktest } from './lib/backtestEngine';
import { Coins, Landmark, Activity, BarChart2 } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentTab, setTab] = useState<MainTab>('crypto');

  // Shared Global UI States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<SignalAnalysis | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Full Binance Futures Universe (525+ tokens, dynamically discovered)
  const [allFuturesList, setAllFuturesList] = useState<TokenCatalogItem[]>(SEEDED_BINANCE_FUTURES);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; isScanning: boolean } | null>(null);
  const isScanCancelledRef = useRef(false);
  const isScanningCryptoRef = useRef(false);
  const isScanningBStocksRef = useRef(false);

  // ==========================================
  // 1. DEDICATED CRYPTOCURRENCY STATE & PULSE
  // ==========================================
  const [cryptoTimeframe, setCryptoTimeframe] = useState('15m');
  const [cryptoWatchlist, setCryptoWatchlist] = useState<string[]>(DEFAULT_CRYPTO_WATCHLIST);
  const [cryptoSignals, setCryptoSignals] = useState<SignalAnalysis[]>([]);
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);

  const [cryptoBullPct, setCryptoBullPct] = useState(62);
  const [cryptoBearPct, setCryptoBearPct] = useState(38);
  const [cryptoAvgVolume, setCryptoAvgVolume] = useState('$450.5M');
  const [cryptoConfirmedCount, setCryptoConfirmedCount] = useState(0);
  const [cryptoAvgWinProb, setCryptoAvgWinProb] = useState(76.5);
  const [cryptoMarketCondition, setCryptoMarketCondition] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');

  // ==========================================
  // 2. DEDICATED bSTOCKS STATE & PULSE
  // ==========================================
  const [bStocksTimeframe, setBStocksTimeframe] = useState('15m');
  const [bStocksWatchlist, setBStocksWatchlist] = useState<string[]>(DEFAULT_BSTOCK_WATCHLIST);
  const [bStocksSignals, setBStocksSignals] = useState<SignalAnalysis[]>([]);
  const [isLoadingBStocks, setIsLoadingBStocks] = useState(false);

  const [bStocksBullPct, setBStocksBullPct] = useState(55);
  const [bStocksBearPct, setBStocksBearPct] = useState(45);
  const [bStocksAvgVolume, setBStocksAvgVolume] = useState('$85.2M');
  const [bStocksConfirmedCount, setBStocksConfirmedCount] = useState(0);
  const [bStocksAvgWinProb, setBStocksAvgWinProb] = useState(74.2);
  const [bStocksMarketCondition, setBStocksMarketCondition] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');

  // ==========================================
  // 3. BACKTESTER STATE
  // ==========================================
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    symbol: 'BTCUSDT',
    timeframe: '15m',
    candleLimit: 500,
    trainRatio: 0.70, // 70% In-Sample, 30% Out-of-Sample (Mandatory Rule 3)
    feeRate: 0.0006,  // 0.06% Binance Taker Fee (Mandatory Rule 2)
    slippageRate: 0.0005, // 0.05% Execution Slippage (Mandatory Rule 2)
    initialCapital: 10000,
    minConfluence: 6, // 6 of 8 conditions
    directionMode: 'BOTH',
    useAtrTrailing: true,
    atrMultiplierSL: 1.5,
    atrMultiplierTP: 3.0,
    rsiOverbought: 70,
    rsiOversold: 30,
    usePrecisionLimitOrders: true,
  });

  const [activeCandles, setActiveCandles] = useState<Candle[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Sync HTML lang and dir attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Scan Cryptocurrency Market & Compute Crypto Market Pulse
  const scanCryptoMarket = useCallback(async () => {
    if (isScanningCryptoRef.current) return;
    isScanningCryptoRef.current = true;
    setIsLoadingCrypto(true);

    try {
      const tickersMap = await fetch24hTickers(cryptoWatchlist);
      const computedSignals: SignalAnalysis[] = [];
      let totalVol = 0;
      let totalTickersWithVol = 0;

      // Scan concurrently in batches of 6
      const batchSize = 6;
      for (let i = 0; i < cryptoWatchlist.length; i += batchSize) {
        const batch = cryptoWatchlist.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (symbol) => {
            try {
              const ticker = tickersMap.get(symbol);
              const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 0;
              const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 80000000;
              const candles = await fetchKlines(symbol, cryptoTimeframe, 120);
              if (candles.length > 25) {
                const analysis = evaluateConfluence(candles, symbol, cryptoTimeframe, change24h, volume24hUsdt);
                return { analysis, volume24hUsdt };
              }
            } catch (err) {
              console.error(`Error scanning crypto ${symbol}:`, err);
            }
            return null;
          })
        );

        for (const item of batchResults) {
          if (item) {
            computedSignals.push(item.analysis);
            if (item.volume24hUsdt > 0) {
              totalVol += item.volume24hUsdt;
              totalTickersWithVol++;
            }
          }
        }
      }

      setCryptoSignals(computedSignals);

      // Compute Crypto Market Pulse
      const confirmed = computedSignals.filter(s => s.confluenceScore >= 6).length;
      setCryptoConfirmedCount(confirmed);

      const longs = computedSignals.filter(s => s.direction === 'LONG').length;
      const shorts = computedSignals.filter(s => s.direction === 'SHORT').length;
      const totalOriented = longs + shorts || 1;
      const bPct = Math.round((longs / totalOriented) * 100);
      const sPct = 100 - bPct;
      setCryptoBullPct(bPct);
      setCryptoBearPct(sPct);

      if (bPct >= 65) setCryptoMarketCondition('BULLISH');
      else if (sPct >= 65) setCryptoMarketCondition('BEARISH');
      else setCryptoMarketCondition('NEUTRAL');

      if (computedSignals.length > 0) {
        const sumProb = computedSignals.reduce((acc, s) => acc + s.entryProbability.probabilityPct, 0);
        setCryptoAvgWinProb(+(sumProb / computedSignals.length).toFixed(1));
      }

      const avgV = totalTickersWithVol > 0 ? totalVol / totalTickersWithVol : 0;
      setCryptoAvgVolume(`$${(avgV / 1_000_000).toFixed(1)}M`);
    } catch (err) {
      console.error('Error scanning crypto market:', err);
    } finally {
      setIsLoadingCrypto(false);
      isScanningCryptoRef.current = false;
    }
  }, [cryptoWatchlist, cryptoTimeframe]);

  // Scan bStocks Market & Compute bStocks Wall Street Market Pulse
  const scanBStocksMarket = useCallback(async () => {
    if (isScanningBStocksRef.current) return;
    isScanningBStocksRef.current = true;
    setIsLoadingBStocks(true);

    try {
      const tickersMap = await fetch24hTickers(bStocksWatchlist);
      const computedSignals: SignalAnalysis[] = [];
      let totalVol = 0;
      let totalTickersWithVol = 0;

      // Scan concurrently in batches of 6
      const batchSize = 6;
      for (let i = 0; i < bStocksWatchlist.length; i += batchSize) {
        const batch = bStocksWatchlist.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (symbol) => {
            try {
              const ticker = tickersMap.get(symbol);
              const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 1.5;
              const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 45000000;
              const candles = await fetchKlines(symbol, bStocksTimeframe, 120);
              if (candles.length > 25) {
                const analysis = evaluateConfluence(candles, symbol, bStocksTimeframe, change24h, volume24hUsdt);
                return { analysis, volume24hUsdt };
              }
            } catch (err) {
              console.error(`Error scanning bStock ${symbol}:`, err);
            }
            return null;
          })
        );

        for (const item of batchResults) {
          if (item) {
            computedSignals.push(item.analysis);
            if (item.volume24hUsdt > 0) {
              totalVol += item.volume24hUsdt;
              totalTickersWithVol++;
            }
          }
        }
      }

      setBStocksSignals(computedSignals);

      // Compute bStocks Market Pulse
      const confirmed = computedSignals.filter(s => s.confluenceScore >= 6).length;
      setBStocksConfirmedCount(confirmed);

      const longs = computedSignals.filter(s => s.direction === 'LONG').length;
      const shorts = computedSignals.filter(s => s.direction === 'SHORT').length;
      const totalOriented = longs + shorts || 1;
      const bPct = Math.round((longs / totalOriented) * 100);
      const sPct = 100 - bPct;
      setBStocksBullPct(bPct);
      setBStocksBearPct(sPct);

      if (bPct >= 65) setBStocksMarketCondition('BULLISH');
      else if (sPct >= 65) setBStocksMarketCondition('BEARISH');
      else setBStocksMarketCondition('NEUTRAL');

      if (computedSignals.length > 0) {
        const sumProb = computedSignals.reduce((acc, s) => acc + s.entryProbability.probabilityPct, 0);
        setBStocksAvgWinProb(+(sumProb / computedSignals.length).toFixed(1));
      }

      const avgV = totalTickersWithVol > 0 ? totalVol / totalTickersWithVol : 0;
      setBStocksAvgVolume(`$${(avgV / 1_000_000).toFixed(1)}M`);
    } catch (err) {
      console.error('Error scanning bStocks market:', err);
    } finally {
      setIsLoadingBStocks(false);
      isScanningBStocksRef.current = false;
    }
  }, [bStocksWatchlist, bStocksTimeframe]);

  // Combined Refresh
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    if (currentTab === 'bstocks') {
      await scanBStocksMarket();
    } else {
      await scanCryptoMarket();
    }
    setLastUpdated(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  }, [currentTab, scanBStocksMarket, scanCryptoMarket]);

  // Initial Boot Scan
  useEffect(() => {
    scanCryptoMarket();
    scanBStocksMarket();
    setLastUpdated(new Date().toLocaleTimeString());
  }, [cryptoTimeframe, bStocksTimeframe]);

  // Periodic 30s background auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentTab === 'bstocks') {
        scanBStocksMarket();
      } else if (currentTab === 'crypto') {
        scanCryptoMarket();
      }
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000);

    return () => clearInterval(timer);
  }, [currentTab, scanCryptoMarket, scanBStocksMarket]);

  // Execute Backtest
  const executeBacktest = useCallback(async () => {
    setIsBacktesting(true);
    try {
      const candles = await fetchKlines(
        backtestConfig.symbol,
        backtestConfig.timeframe,
        backtestConfig.candleLimit
      );
      setActiveCandles(candles);
      const result = runVectorizedBacktest(candles, backtestConfig);
      setBacktestResult(result);
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setIsBacktesting(false);
    }
  }, [backtestConfig]);

  useEffect(() => {
    executeBacktest();
  }, [backtestConfig.symbol, backtestConfig.timeframe]);

  // Helper when user clicks "Run Backtest" from scanner row or modal
  const handleBacktestSymbol = (symbol: string) => {
    setBacktestConfig(prev => ({
      ...prev,
      symbol: symbol.toUpperCase(),
      timeframe: currentTab === 'bstocks' ? bStocksTimeframe : cryptoTimeframe,
    }));
    setTab('backtest');
  };

  // Specific Crypto Symbol Analyzer
  const handleAnalyzeCryptoSymbol = async (sym: string) => {
    const clean = normalizeSymbol(sym);
    const existing = cryptoSignals.find(s => s.symbol === clean);
    if (existing) {
      setSelectedSignal(existing);
      return;
    }

    setIsLoadingCrypto(true);
    try {
      const tickersMap = await fetch24hTickers([clean]);
      const ticker = tickersMap.get(clean);
      const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 2.5;
      const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 75000000;
      const candles = await fetchKlines(clean, cryptoTimeframe, 120);

      if (candles.length > 25) {
        const analysis = evaluateConfluence(candles, clean, cryptoTimeframe, change24h, volume24hUsdt);
        setCryptoSignals(prev => [analysis, ...prev.filter(s => s.symbol !== clean)]);
        if (!cryptoWatchlist.includes(clean)) {
          setCryptoWatchlist(prev => [clean, ...prev]);
        }
        setSelectedSignal(analysis);
      }
    } catch (err) {
      console.error('Error analyzing crypto symbol:', err);
    } finally {
      setIsLoadingCrypto(false);
    }
  };

  // Specific bStock Symbol Analyzer
  const handleAnalyzeBStockSymbol = async (sym: string) => {
    const clean = normalizeSymbol(sym);
    const existing = bStocksSignals.find(s => s.symbol === clean);
    if (existing) {
      setSelectedSignal(existing);
      return;
    }

    setIsLoadingBStocks(true);
    try {
      const tickersMap = await fetch24hTickers([clean]);
      const ticker = tickersMap.get(clean);
      const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 1.8;
      const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 45000000;
      const candles = await fetchKlines(clean, bStocksTimeframe, 120);

      if (candles.length > 25) {
        const analysis = evaluateConfluence(candles, clean, bStocksTimeframe, change24h, volume24hUsdt);
        setBStocksSignals(prev => [analysis, ...prev.filter(s => s.symbol !== clean)]);
        if (!bStocksWatchlist.includes(clean)) {
          setBStocksWatchlist(prev => [clean, ...prev]);
        }
        setSelectedSignal(analysis);
      }
    } catch (err) {
      console.error('Error analyzing bStock symbol:', err);
    } finally {
      setIsLoadingBStocks(false);
    }
  };

  // Load all 31 bStocks into signals
  const handleLoadAllBStocks = async () => {
    setIsLoadingBStocks(true);
    try {
      const allSymbols = DEFAULT_BSTOCK_WATCHLIST;
      setBStocksWatchlist(allSymbols);
      const tickersMap = await fetch24hTickers(allSymbols);
      const newComputed: SignalAnalysis[] = [];
      const batchSize = 6;

      for (let i = 0; i < allSymbols.length; i += batchSize) {
        const batch = allSymbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (sym) => {
            try {
              const ticker = tickersMap.get(sym);
              const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 1.2;
              const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 55000000;
              const candles = await fetchKlines(sym, bStocksTimeframe, 120);
              if (candles.length > 25) {
                return evaluateConfluence(candles, sym, bStocksTimeframe, change24h, volume24hUsdt);
              }
            } catch (err) {
              console.error(`Error computing bStock ${sym}:`, err);
            }
            return null;
          })
        );
        for (const res of batchResults) {
          if (res) newComputed.push(res);
        }
      }

      setBStocksSignals(newComputed);
    } catch (err) {
      console.error('Error in handleLoadAllBStocks:', err);
    } finally {
      setIsLoadingBStocks(false);
    }
  };

  const handleLoadCryptoCategorySymbols = async (categorySymbols: string[]) => {
    setCryptoWatchlist(prev => {
      const set = new Set([...categorySymbols, ...prev]);
      return Array.from(set);
    });

    setIsLoadingCrypto(true);
    try {
      const tickersMap = await fetch24hTickers(categorySymbols);
      const newComputed: SignalAnalysis[] = [];
      const batchSize = 6;

      for (let i = 0; i < categorySymbols.length; i += batchSize) {
        const batch = categorySymbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (sym) => {
            try {
              const ticker = tickersMap.get(sym);
              const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 1.2;
              const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 55000000;
              const candles = await fetchKlines(sym, cryptoTimeframe, 120);
              if (candles.length > 25) {
                return evaluateConfluence(candles, sym, cryptoTimeframe, change24h, volume24hUsdt);
              }
            } catch (err) {
              console.error(`Error computing crypto ${sym}:`, err);
            }
            return null;
          })
        );
        for (const res of batchResults) {
          if (res) newComputed.push(res);
        }
      }

      setCryptoSignals(prev => {
        const map = new Map<string, SignalAnalysis>();
        prev.forEach(s => map.set(s.symbol, s));
        newComputed.forEach(s => map.set(s.symbol, s));
        return Array.from(map.values());
      });
    } catch (err) {
      console.error('Error in handleLoadCryptoCategorySymbols:', err);
    } finally {
      setIsLoadingCrypto(false);
    }
  };

  // Discover and load all 525+ available Binance USDT Perpetual Futures contracts dynamically
  useEffect(() => {
    loadAllBinanceFuturesTokens().then((tokens) => {
      if (tokens && tokens.length > 50) {
        setAllFuturesList(tokens);
      }
    });
  }, []);

  // Universe Batch Scanning Handler (Top 25, Top 50, Top 100, or All 525+ contracts)
  const handleScanFuturesBatch = async (type: 'TOP25' | 'TOP50' | 'TOP100' | 'ALL') => {
    isScanCancelledRef.current = false;
    setIsLoadingCrypto(true);

    try {
      const tickersMap = await fetch24hTickers(allFuturesList.map(f => f.symbol));

      let targetSymbols: string[] = [];
      if (type === 'ALL') {
        targetSymbols = allFuturesList.map(f => f.symbol);
      } else {
        const count = type === 'TOP25' ? 25 : type === 'TOP50' ? 50 : 100;
        const sorted = [...allFuturesList].sort((a, b) => {
          const volA = parseFloat(tickersMap.get(a.symbol)?.quoteVolume || '0');
          const volB = parseFloat(tickersMap.get(b.symbol)?.quoteVolume || '0');
          return volB - volA;
        });
        targetSymbols = sorted.slice(0, count).map(s => s.symbol);
      }

      setCryptoWatchlist(targetSymbols);
      setScanProgress({ current: 0, total: targetSymbols.length, isScanning: true });

      const batchSize = 8;
      const computedSignals: SignalAnalysis[] = [];
      let totalVol = 0;
      let totalTickersWithVol = 0;

      for (let i = 0; i < targetSymbols.length; i += batchSize) {
        if (isScanCancelledRef.current) break;

        const batch = targetSymbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (symbol) => {
            try {
              const ticker = tickersMap.get(symbol);
              const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 0;
              const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 80000000;
              const candles = await fetchKlines(symbol, cryptoTimeframe, 120);
              if (candles.length > 25) {
                const analysis = evaluateConfluence(candles, symbol, cryptoTimeframe, change24h, volume24hUsdt);
                return { analysis, volume24hUsdt };
              }
            } catch (err) {
              console.error(`Error scanning futures ${symbol}:`, err);
            }
            return null;
          })
        );

        for (const item of batchResults) {
          if (item) {
            computedSignals.push(item.analysis);
            if (item.volume24hUsdt > 0) {
              totalVol += item.volume24hUsdt;
              totalTickersWithVol++;
            }
          }
        }

        // Live stream signals to UI as batches complete
        setCryptoSignals([...computedSignals]);
        setScanProgress({ 
          current: Math.min(i + batchSize, targetSymbols.length), 
          total: targetSymbols.length, 
          isScanning: true 
        });
      }

      // Recompute Crypto Market Pulse
      const confirmed = computedSignals.filter(s => s.confluenceScore >= 6).length;
      setCryptoConfirmedCount(confirmed);

      const longs = computedSignals.filter(s => s.direction === 'LONG').length;
      const shorts = computedSignals.filter(s => s.direction === 'SHORT').length;
      const totalOriented = longs + shorts || 1;
      const bPct = Math.round((longs / totalOriented) * 100);
      const sPct = 100 - bPct;
      setCryptoBullPct(bPct);
      setCryptoBearPct(sPct);

      if (bPct >= 65) setCryptoMarketCondition('BULLISH');
      else if (sPct >= 65) setCryptoMarketCondition('BEARISH');
      else setCryptoMarketCondition('NEUTRAL');

      if (computedSignals.length > 0) {
        const sumProb = computedSignals.reduce((acc, s) => acc + s.entryProbability.probabilityPct, 0);
        setCryptoAvgWinProb(+(sumProb / computedSignals.length).toFixed(1));
      }

      const avgV = totalTickersWithVol > 0 ? totalVol / totalTickersWithVol : 0;
      setCryptoAvgVolume(`$${(avgV / 1_000_000).toFixed(1)}M`);
    } catch (err) {
      console.error('Error scanning futures batch:', err);
    } finally {
      setScanProgress(null);
      setIsLoadingCrypto(false);
    }
  };

  const handleStopScan = () => {
    isScanCancelledRef.current = true;
    setScanProgress(null);
    setIsLoadingCrypto(false);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        setTab={setTab}
        lang={lang}
        toggleLang={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 flex-1">
        {/* Market Mode Switcher Banner (Crypto vs bStocks) */}
        {(currentTab === 'crypto' || currentTab === 'bstocks') && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-[#0c1322] border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setTab('crypto')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentTab === 'crypto'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? '🪙 قسم العملات المشفرة فيوتشر (Crypto)' : '🪙 Crypto Futures Section'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono font-bold">
                  {allFuturesList.length || 525}+
                </span>
              </button>

              <button
                onClick={() => setTab('bstocks')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentTab === 'bstocks'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 ring-2 ring-indigo-400/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Landmark className="w-4 h-4 text-indigo-400" />
                <span>{lang === 'ar' ? '🏛️ قسم أسهم bStocks المرمزة (31 سهم)' : '🏛️ bStocks Equities (31 Assets)'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono font-bold">
                  31 bStocks
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono px-2 hidden lg:flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${currentTab === 'crypto' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
              <span>{currentTab === 'crypto' ? (lang === 'ar' ? `الماسح والاتجاه نشط: ${allFuturesList.length || 525}+ عقد فيوتشر` : `Active Module: ${allFuturesList.length || 525}+ Binance Futures`) : (lang === 'ar' ? 'الماسح والاتجاه نشط: أسهم bStocks المرمزة' : 'Active Module: bStocks Scanner & Pulse')}</span>
            </div>
          </div>
        )}

        {/* 1. CRYPTO SECTION: Independent Pulse + Dedicated Crypto Scanner */}
        {currentTab === 'crypto' && (
          <div className="space-y-6">
            <MarketPulseBar
              marketTitle={translations[lang].cryptoPulseTitle}
              badgeLabel={`${allFuturesList.length || 525}+ ${translations[lang].allFuturesBadge}`}
              isBStocks={false}
              bullPct={cryptoBullPct}
              bearPct={cryptoBearPct}
              avgVolume={cryptoAvgVolume}
              confirmedCount={cryptoConfirmedCount}
              avgWinProb={cryptoAvgWinProb}
              marketCondition={cryptoMarketCondition}
              lang={lang}
            />

            <ScannerView
              signals={cryptoSignals}
              isLoading={isLoadingCrypto}
              timeframe={cryptoTimeframe}
              setTimeframe={setCryptoTimeframe}
              onSelectSignal={setSelectedSignal}
              onBacktestSymbol={handleBacktestSymbol}
              onAddCustomSymbol={(sym) => {
                const clean = normalizeSymbol(sym);
                if (!cryptoWatchlist.includes(clean)) {
                  setCryptoWatchlist(prev => [clean, ...prev]);
                }
              }}
              onAnalyzeSpecificSymbol={handleAnalyzeCryptoSymbol}
              onLoadCategorySymbols={handleLoadCryptoCategorySymbols}
              onSwitchToBStocks={() => setTab('bstocks')}
              lang={lang}
              totalFuturesCount={allFuturesList.length || 525}
              scanProgress={scanProgress}
              onStopScan={handleStopScan}
              onScanBatch={handleScanFuturesBatch}
              allFuturesList={allFuturesList}
            />
          </div>
        )}

        {/* 2. bSTOCKS SECTION: Independent Pulse + Dedicated bStocks Scanner */}
        {currentTab === 'bstocks' && (
          <div className="space-y-6">
            <MarketPulseBar
              marketTitle={translations[lang].bStocksPulseTitle}
              badgeLabel={translations[lang].bStocksActiveCountBadge}
              isBStocks={true}
              bullPct={bStocksBullPct}
              bearPct={bStocksBearPct}
              avgVolume={bStocksAvgVolume}
              confirmedCount={bStocksConfirmedCount}
              avgWinProb={bStocksAvgWinProb}
              marketCondition={bStocksMarketCondition}
              lang={lang}
            />

            <BStockScannerView
              signals={bStocksSignals}
              isLoading={isLoadingBStocks}
              timeframe={bStocksTimeframe}
              setTimeframe={setBStocksTimeframe}
              onSelectSignal={setSelectedSignal}
              onBacktestSymbol={handleBacktestSymbol}
              onAddCustomSymbol={(sym) => {
                const clean = normalizeSymbol(sym);
                if (!bStocksWatchlist.includes(clean)) {
                  setBStocksWatchlist(prev => [clean, ...prev]);
                }
              }}
              onAnalyzeSpecificSymbol={handleAnalyzeBStockSymbol}
              onLoadAllBStocks={handleLoadAllBStocks}
              lang={lang}
            />
          </div>
        )}

        {/* 3. VECTORIZED BACKTESTER ENGINE */}
        {currentTab === 'backtest' && (
          <BacktesterView
            candles={activeCandles}
            config={backtestConfig}
            setConfig={setBacktestConfig}
            result={backtestResult}
            onRunBacktest={executeBacktest}
            isRunning={isBacktesting}
            lang={lang}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* 4. PYTHON VECTORBT GENERATOR */}
        {currentTab === 'generator' && (
          <PythonCodeGenerator
            config={backtestConfig}
            lang={lang}
          />
        )}
      </main>

      {/* Confluence Inspector Modal */}
      <ConfluenceModal
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onRunBacktest={handleBacktestSymbol}
        lang={lang}
      />

      {/* Pre-Live Strategy Testing Roadmap Modal */}
      <StrategyTestingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lang={lang}
        onGoToBacktest={() => setTab('backtest')}
        onGoToPython={() => setTab('generator')}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0e17] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Ultra Alpha Quant · Automated Strategy Generator & Vectorized Backtesting
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {translations[lang].vercelReady}
          </div>
        </div>
      </footer>
    </div>
  );
}
