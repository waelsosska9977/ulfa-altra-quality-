import React, { useState } from 'react';
import { X, ShieldCheck, CheckSquare, Square, ExternalLink, ArrowRight, Terminal, BarChart3, Coins, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface StrategyTestingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onGoToBacktest: () => void;
  onGoToPython: () => void;
}

export const StrategyTestingGuideModal: React.FC<StrategyTestingGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
  onGoToBacktest,
  onGoToPython,
}) => {
  const t = translations[lang];

  // Interactive Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    backtestRun: false,
    outOfSampleRobust: false,
    feesEnforced: true, // checked by default because app enforces it
    testnetTrades: false,
    riskRuleSet: false,
    lowLeverageSet: false,
  });

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = Object.keys(checkedItems).length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-[#0b101d] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Risk Management Protocol
                </span>
                <span className="text-xs text-slate-400">Zero-Loss Learning</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {t.testingGuideTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.testingGuideSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readiness Meter */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">
              {lang === 'ar' ? 'مقياس الجاهزية للتداول الحي:' : 'Live Trading Readiness Score:'}
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {completedCount} / {totalCount} ({progressPct}%)
            </span>
          </div>

          <div className="w-full sm:w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                progressPct === 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Body content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Overview alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-1">
                {lang === 'ar' ? 'القاعدة الذهبية في التداول الكمي:' : 'The Golden Rule of Quantitative Trading:'}
              </strong>
              {lang === 'ar'
                ? 'لا تودع دولاراً حقيقياً واحداً في منصة التداول قبل إثبات نجاح الإستراتيجية في 4 مراحل متعاقبة: الباك تيست التاريخي، كشف فرط المطابقة، الحساب التجريبي المجاني (Paper Trading)، ثم التداول المصغر برأس مال رمزي.'
                : 'Never risk real money before systematically proving the strategy across 4 rigorous stages: historical backtest, overfitting audit, zero-risk paper trading, and micro-capital live testing.'}
            </div>
          </div>

          {/* The 4 Stages Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Stage 1: Web Backtest */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                      1
                    </div>
                    <span className="font-bold text-white text-sm">{t.testStage1Title}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {lang === 'ar' ? 'فوري بالموقع' : 'Instant Web'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {lang === 'ar'
                    ? 'قم بالدخول لتبويب "اختبار الإستراتيجية"، واختر العملة (مثل BTC أو SOL) والإطار الزمني (15m أو 1h). يقوم النظام تلقائياً بتطبيق عمولة بينانس (0.06%) والانزلاق السعري وتقسيم البيانات 70% In-Sample و 30% Out-of-Sample للتأكد من عدم تراجع الأداء في المستقبل.'
                    : 'Open the Backtest tab, pick an asset and timeframe. The engine applies mandatory 0.06% fees, slippage, and a 70/30 train/test split to verify performance stability on unseen bars.'}
                </p>
                <div className="mt-3 p-2.5 bg-black/40 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
                  <div>🎯 {lang === 'ar' ? 'معامل الربحية المستهدف' : 'Target Profit Factor'}: <span className="text-emerald-400 font-bold">&gt; 1.5</span></div>
                  <div>🎯 {lang === 'ar' ? 'أقصى تراجع للمحفظة' : 'Max Drawdown'}: <span className="text-emerald-400 font-bold">&lt; 15%</span></div>
                  <div>🎯 {lang === 'ar' ? 'فحص الـ Overfitting' : 'Overfitting Status'}: <span className="text-emerald-400 font-bold">ROBUST</span></div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onGoToBacktest();
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'فتح شاشة الباك تيست الآن' : 'Open Web Backtester'}</span>
              </button>
            </div>

            {/* Stage 2: Standalone Python Vectorbt */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-xs">
                      2
                    </div>
                    <span className="font-bold text-white text-sm">{t.testStage2Title}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    Vectorbt Engine
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {lang === 'ar'
                    ? 'انسخ كود بايثون الجاهز من تبويب "مولد كود بايثون"، وشغّله على جهازك الشخصي أو Google Colab. يقوم السكربت بمحاكاة آلاف الشموع التاريخية بدقة متناهية واستخراج تقرير أداء كمي كامل بدون أي أكواد ناقصة.'
                    : 'Download or copy the production-ready script from the Python Generator. Execute it locally or in Jupyter/Colab to benchmark across multi-year data and diverse market cycles.'}
                </p>
                <div className="mt-3 p-2.5 bg-black/40 rounded-lg text-[11px] font-mono text-slate-400 select-all overflow-x-auto">
                  <span className="text-cyan-400 font-bold">pip</span> install vectorbt pandas numpy requests
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onGoToPython();
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'ar' ? 'عرض كود البايثون المولد' : 'View Generated Python'}</span>
              </button>
            </div>

            {/* Stage 3: Binance Futures Testnet (Paper Trading) */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono text-xs">
                      3
                    </div>
                    <span className="font-bold text-white text-sm">{t.testStage3Title}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    15,000 USDT Free
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {lang === 'ar'
                    ? 'منصة بينانس الرسمية توفر بيئة تجريبية مطابقة تماماً لسوق الفيوتشر الحقيقي مع رصيد مجاني 15,000 USDT افتراضية بدون إيداع. نفّذ الصفقات بناءً على إشارات الماسح (Confluence ≥ 6/8 ونسبة دخول ≥ 75%) وسجّل 30 صفقة متتالية.'
                    : 'Binance provides an official Testnet simulating live order-books with 15,000 virtual USDT. Execute live scanner signals with precision limit orders, recording at least 30 paper trades.'}
                </p>
                <div className="mt-3 p-2.5 bg-black/40 rounded-lg text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-amber-300">
                    {lang === 'ar' ? 'كيف تبدأ الحساب التجريبي المجاني؟' : 'How to start Paper Trading:'}
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 space-y-0.5">
                    <li>{lang === 'ar' ? 'سجل في testnet.binancefuture.com' : 'Register at testnet.binancefuture.com'}</li>
                    <li>{lang === 'ar' ? 'احصل على رصيد وهمي بضغطة زر' : 'Claim virtual funds instantly'}</li>
                    <li>{lang === 'ar' ? 'ضع أوامر الدخول والوقف المحسوبة هنا' : 'Place calculated Limit & SL orders'}</li>
                  </ol>
                </div>
              </div>

              <a
                href="https://testnet.binancefuture.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'فتح منصة بينانس التجريبية (Testnet)' : 'Open Binance Testnet'}</span>
                <ExternalLink className="w-3 h-3 ms-1" />
              </a>
            </div>

            {/* Stage 4: Micro-Live Trading */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold font-mono text-xs">
                      4
                    </div>
                    <span className="font-bold text-white text-sm">{t.testStage4Title}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                    10$ Real Only
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {lang === 'ar'
                    ? 'بعد نجاح الـ 30 صفقة في الحساب التجريبي، انتقل للحساب الحقيقي بمبلغ رمزي جداً (10$ إلى 20$) ورافعة مالية منخفضة (3x أو 5x). الهدف هنا ليس الثراء بل اختبار الانضباط النفسي، وسرعة تنفيذ المنصة، والانزلاق اللحظي بأمان مطلق.'
                    : 'After passing the paper trading phase, transition to real funds with micro-capital ($10-$20) and conservative leverage (3x-5x) to validate live slippage and psychological execution.'}
                </p>
                <div className="mt-3 p-2.5 bg-black/40 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
                  <div>🛡️ {lang === 'ar' ? 'الرافعة الموصى بها' : 'Leverage'}: <span className="text-purple-400 font-bold">3x - 5x (Max)</span></div>
                  <div>🛡️ {lang === 'ar' ? 'المخاطرة لكل صفقة' : 'Risk per trade'}: <span className="text-purple-400 font-bold">1% of Capital</span></div>
                  <div>🛡️ {lang === 'ar' ? 'وقف الخسارة' : 'Stop Loss'}: <span className="text-emerald-400 font-bold">Mandatory (إلزامي دائماً)</span></div>
                </div>
              </div>

              <div className="p-2 bg-slate-950/80 rounded-lg text-[11px] text-center text-slate-400 border border-slate-800">
                {lang === 'ar' ? 'التوسع التدريجي فقط بعد 50 صفقة رابحة إجمالاً' : 'Scale capital up only after 50 net-profitable trades'}
              </div>
            </div>

          </div>

          {/* Interactive Go / No-Go Checklist */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>{t.checklistTitle}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {lang === 'ar' ? 'علّم البنود للتأكد من جاهزيتك' : 'Check items to confirm readiness'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <div 
                onClick={() => toggleCheck('backtestRun')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.backtestRun ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '1. فحص الباك تيست بربحية إيجابية' : '1. Positive Backtest Metrics'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'Profit Factor > 1.5 و Win Rate > 55% مع احتساب رسوم 0.06%' : 'Profit Factor > 1.5, Win Rate > 55% after 0.06% fees'}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => toggleCheck('outOfSampleRobust')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.outOfSampleRobust ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '2. تجاوز فحص فرط المطابقة (ROBUST)' : '2. Passed Overfitting Check'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'استقرار العائد في بيانات الاختبار (Out-of-Sample 30%)' : 'Stable return in unseen out-of-sample data (30%)'}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => toggleCheck('feesEnforced')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.feesEnforced ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '3. احتساب عمولة المنصة والانزلاق السعري' : '3. Fees & Slippage Realism'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'النتائج ليست وهمية وتم خصم 0.06% لكل تنفيذ + 0.05% انزلاق' : 'Guaranteed deduction of 0.06% Binance fee + 0.05% slippage'}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => toggleCheck('testnetTrades')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.testnetTrades ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '4. تنفيذ 30 صفقة تجريبية على Testnet' : '4. Completed 30 Testnet Trades'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'تجربة حية كاملة برصيد افتراضي للتأقلم مع تحركات السوق' : 'Hands-on practice without risking real capital'}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => toggleCheck('riskRuleSet')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.riskRuleSet ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '5. الالتزام بوقف خسارة صارم (Hard Stop Loss)' : '5. Mandatory Hard Stop Loss'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'تحديد الخسارة القصوى مسبقاً بما لا يزيد عن 1%-2% من المحفظة' : 'Risk predetermined and capped at 1%-2% of total equity'}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => toggleCheck('lowLeverageSet')}
                className="p-3 rounded-lg bg-black/30 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-start gap-2.5 transition-colors"
              >
                {checkedItems.lowLeverageSet ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-200">
                    {lang === 'ar' ? '6. تجنب الرافعات المالية العالية (3x إلى 5x فقط)' : '6. Conservative Leverage (3x - 5x)'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'ar' ? 'إبقاء سعر التصفية بعيداً عن منطقة تذبذب السوق اليومية' : 'Keeping liquidation price safely far away from market noise'}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'ar' ? 'النجاح في التداول يبدأ بحماية رأس المال أولاً.' : 'Trading mastery begins with capital preservation first.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {lang === 'ar' ? 'فهمت، إغلاق الدليل' : 'Understood, Close Guide'}
            </button>
            <button
              onClick={() => {
                onClose();
                onGoToBacktest();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{lang === 'ar' ? 'ابدأ الاختبار الآن' : 'Start Backtesting Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
