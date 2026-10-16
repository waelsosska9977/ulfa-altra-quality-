import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MarketPulseBar } from './components/MarketPulseBar';
import { ScannerView } from './components/ScannerView';
import { ConfluenceModal } from './components/ConfluenceModal';
import { BacktesterView } from './components/BacktesterView';
import { PythonCodeGenerator } from './components/PythonCodeGenerator';
import { Language, translations } from './i18n/translations';
import { SignalAnalysis, BacktestConfig, BacktestResult, Candle } from './types/quant';
import { fetch24hTickers, fetchKlines, TOP_WATCHLIST } from './lib/binanceApi';
import { evaluateConfluence } from './lib/indicators';
import { runVectorizedBacktest } from './lib/backtestEngine';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentTab, setTab] = useState<'scanner' | 'backtest' | 'generator'>('scanner');

  // Scanner state
  const [timeframe, setTimeframe] = useState('15m');
  const [watchlist, setWatchlist] = useState<string[]>(TOP_WATCHLIST);
  const [signals, setSignals] = useState<SignalAnalysis[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<SignalAnalysis | null>(null);

  // Market pulse
  const [bullPct, setBullPct] = useState(58);
  const [bearPct, setBearPct] = useState(42);
  const [avgVolume, setAvgVolume] = useState('$420.5M');
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [avgWinProb, setAvgWinProb] = useState(76.2);
  const [marketCondition, setMarketCondition] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');

  // Backtest state
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

  // Load Market Signals from Binance
  const scanMarket = useCallback(async () => {
    setIsRefreshing(true);
    if (signals.length === 0) setIsLoadingSignals(true);

    try {
      const tickersMap = await fetch24hTickers(watchlist);
      const computedSignals: SignalAnalysis[] = [];
      let totalVol = 0;
      let totalTickersWithVol = 0;

      // Scan each asset
      for (const symbol of watchlist) {
        const ticker = tickersMap.get(symbol);
        const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 0;
        const volume24hUsdt = ticker ? parseFloat(ticker.quoteVolume) : 50000000;

        if (volume24hUsdt > 0) {
          totalVol += volume24hUsdt;
          totalTickersWithVol++;
        }

        const candles = await fetchKlines(symbol, timeframe, 120);
        if (candles.length > 30) {
          const analysis = evaluateConfluence(candles, symbol, timeframe, change24h, volume24hUsdt);
          computedSignals.push(analysis);
        }
      }

      setSignals(computedSignals);

      // Compute Market Pulse
      const confirmed = computedSignals.filter(s => s.confluenceScore >= 6).length;
      setConfirmedCount(confirmed);

      const longs = computedSignals.filter(s => s.direction === 'LONG').length;
      const shorts = computedSignals.filter(s => s.direction === 'SHORT').length;
      const totalOriented = longs + shorts || 1;
      const bPct = Math.round((longs / totalOriented) * 100);
      const sPct = 100 - bPct;
      setBullPct(bPct);
      setBearPct(sPct);

      if (bPct >= 65) setMarketCondition('BULLISH');
      else if (sPct >= 65) setMarketCondition('BEARISH');
      else setMarketCondition('NEUTRAL');

      if (computedSignals.length > 0) {
        const sumProb = computedSignals.reduce((acc, s) => acc + s.entryProbability.probabilityPct, 0);
        setAvgWinProb(+(sumProb / computedSignals.length).toFixed(1));
      }

      const avgV = totalTickersWithVol > 0 ? totalVol / totalTickersWithVol : 0;
      setAvgVolume(`$${(avgV / 1_000_000).toFixed(1)}M`);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error scanning market:', err);
    } finally {
      setIsLoadingSignals(false);
      setIsRefreshing(false);
    }
  }, [watchlist, timeframe, signals.length]);

  // Trigger initial scan & periodic auto-refresh every 30s
  useEffect(() => {
    scanMarket();
    const timer = setInterval(() => {
      scanMarket();
    }, 30000);
    return () => clearInterval(timer);
  }, [scanMarket]);

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

  // Run backtest on mount or symbol change
  useEffect(() => {
    executeBacktest();
  }, [backtestConfig.symbol, backtestConfig.timeframe]);

  // Helper when user clicks "Run Backtest" from scanner row or modal
  const handleBacktestSymbol = (symbol: string) => {
    setBacktestConfig(prev => ({
      ...prev,
      symbol: symbol.toUpperCase(),
      timeframe,
    }));
    setTab('backtest');
  };

  const handleAddCustomSymbol = (sym: string) => {
    if (!watchlist.includes(sym)) {
      setWatchlist(prev => [sym, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        setTab={setTab}
        lang={lang}
        toggleLang={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
        onRefresh={scanMarket}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 flex-1">
        {/* Market Pulse Bar */}
        <MarketPulseBar
          bullPct={bullPct}
          bearPct={bearPct}
          avgVolume={avgVolume}
          confirmedCount={confirmedCount}
          avgWinProb={avgWinProb}
          marketCondition={marketCondition}
          lang={lang}
        />

        {/* Tab 1: Live Confluence Scanner */}
        {currentTab === 'scanner' && (
          <ScannerView
            signals={signals}
            isLoading={isLoadingSignals}
            timeframe={timeframe}
            setTimeframe={setTimeframe}
            onSelectSignal={setSelectedSignal}
            onBacktestSymbol={handleBacktestSymbol}
            onAddCustomSymbol={handleAddCustomSymbol}
            lang={lang}
          />
        )}

        {/* Tab 2: Vectorized Backtester Engine */}
        {currentTab === 'backtest' && (
          <BacktesterView
            candles={activeCandles}
            config={backtestConfig}
            setConfig={setBacktestConfig}
            result={backtestResult}
            onRunBacktest={executeBacktest}
            isRunning={isBacktesting}
            lang={lang}
          />
        )}

        {/* Tab 3: Complete Python Vectorbt Generator */}
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
