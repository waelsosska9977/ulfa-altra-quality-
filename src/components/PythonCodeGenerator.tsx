import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, ShieldCheck, Cpu, Database } from 'lucide-react';
import { BacktestConfig } from '../types/quant';
import { generateProductionPythonScript } from '../lib/pythonGenerator';
import { Language, translations } from '../i18n/translations';

interface PythonCodeGeneratorProps {
  config: BacktestConfig;
  lang: Language;
}

export const PythonCodeGenerator: React.FC<PythonCodeGeneratorProps> = ({ config, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  const pythonScript = generateProductionPythonScript(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([pythonScript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${config.symbol.toLowerCase()}_quant_strategy.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner & Compliance Proof */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>{t.pythonGeneratorTitle}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              {t.pythonGeneratorDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.codeCopied : t.copyCode}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadPython}</span>
            </button>
          </div>
        </div>

        {/* 3 Enforced Rules Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-200">100% Vectorized Math</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Vectorbt, Pandas EWM & NumPy rolling matrices without slow loops</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-200">Enforced 0.06% Fees + Slippage</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Binance VIP0 taker fee (0.0006) + 0.05% realistic execution slippage</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-200">Train/Test Partitioning</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Mandatory In-Sample vs Out-of-Sample split to audit curve-fitting</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ms-2 text-slate-400">{config.symbol.toLowerCase()}_quant_strategy.py</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">Python 3.10+ / Vectorbt 0.25+</div>
        </div>

        <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[600px] select-all">
          <code>{pythonScript}</code>
        </pre>
      </div>

      {/* Terminal execution tip */}
      <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-slate-300">{t.executionInstructions}</div>
          <div className="text-slate-400 text-[11px]">Run these terminal commands in your Python environment:</div>
        </div>
        <div className="bg-black/60 border border-slate-700/80 rounded-lg px-3 py-2 font-mono text-[11px] text-emerald-400 select-all shrink-0">
          pip install vectorbt pandas numpy requests && python {config.symbol.toLowerCase()}_quant_strategy.py
        </div>
      </div>
    </div>
  );
};
