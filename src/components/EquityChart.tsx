import React, { useState, useMemo } from 'react';
import { BacktestResult } from '../types/quant';
import { Language, translations } from '../i18n/translations';

interface EquityChartProps {
  result: BacktestResult;
  lang: Language;
}

export const EquityChart: React.FC<EquityChartProps> = ({ result, lang }) => {
  const t = translations[lang];
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = result.equitySeries;
  const splitIndex = useMemo(() => {
    return series.findIndex((pt) => pt.sampleType === 'OUT_OF_SAMPLE');
  }, [series]);

  const { minEq, maxEq, maxDd } = useMemo(() => {
    if (series.length === 0) return { minEq: 10000, maxEq: 10000, maxDd: 10 };
    let min = Infinity;
    let max = -Infinity;
    let worstDd = 0;

    for (const pt of series) {
      if (pt.equity < min) min = pt.equity;
      if (pt.benchmark < min) min = pt.benchmark;
      if (pt.equity > max) max = pt.equity;
      if (pt.benchmark > max) max = pt.benchmark;
      if (Math.abs(pt.drawdown) > worstDd) worstDd = Math.abs(pt.drawdown);
    }

    const pad = (max - min) * 0.08 || 100;
    return {
      minEq: Math.max(0, min - pad),
      maxEq: max + pad,
      maxDd: Math.max(5, worstDd * 1.15),
    };
  }, [series]);

  if (series.length === 0) return null;

  const width = 800;
  const height = 300;
  const ddHeight = 65;
  const eqHeight = height - ddHeight - 35;

  const getX = (idx: number) => (idx / (series.length - 1 || 1)) * (width - 70) + 15;
  const getEqY = (val: number) => eqHeight - ((val - minEq) / (maxEq - minEq || 1)) * eqHeight + 15;
  const getDdY = (dd: number) => height - 10 - ((Math.abs(dd) / (maxDd || 1)) * ddHeight);

  // Path for Strategy Equity
  const equityPath = series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getEqY(pt.equity).toFixed(1)}`)
    .join(' ');

  // Path for Benchmark
  const benchmarkPath = series
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getEqY(pt.benchmark).toFixed(1)}`)
    .join(' ');

  // Drawdown Area Path
  const ddPoints = series.map((pt, i) => `${getX(i).toFixed(1)},${getDdY(pt.drawdown).toFixed(1)}`);
  const ddAreaPath = `M ${getX(0).toFixed(1)},${height - 10} L ${ddPoints.join(' L ')} L ${getX(series.length - 1).toFixed(1)},${height - 10} Z`;

  const splitX = splitIndex !== -1 ? getX(splitIndex) : null;
  const hoveredPoint = hoverIndex !== null ? series[hoverIndex] : series[series.length - 1];

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Chart Legend & Live Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-white">{t.chartEquity}</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
              Strategy Net
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-500 inline-block stroke-dasharray" />
              Buy & Hold
            </span>
          </div>
        </div>

        {hoveredPoint && (
          <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
            <span className="text-slate-400">
              {new Date(hoveredPoint.time).toLocaleDateString()}
            </span>
            <span className="text-emerald-400 font-bold">
              ${hoveredPoint.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400">
              B&H: ${hoveredPoint.benchmark.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-rose-400">
              DD: {hoveredPoint.drawdown.toFixed(2)}%
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              hoveredPoint.sampleType === 'IN_SAMPLE' ? 'bg-blue-900/40 text-blue-300' : 'bg-emerald-900/40 text-emerald-300'
            }`}>
              {hoveredPoint.sampleType === 'IN_SAMPLE' ? 'TRAIN' : 'TEST'}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(
              series.length - 1,
              Math.max(0, Math.round(relX * (series.length - 1)))
            );
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {[0.2, 0.5, 0.8].map((ratio) => {
            const y = eqHeight * ratio + 15;
            const eqVal = maxEq - (maxEq - minEq) * ratio;
            return (
              <g key={ratio}>
                <line x1="0" y1={y} x2={width - 65} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={width - 60} y={y + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                  ${eqVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Drawdown Section Divider */}
          <line x1="0" y1={eqHeight + 15} x2={width} y2={eqHeight + 15} stroke="#1e293b" />
          <text x="15" y={eqHeight + 28} fill="#475569" fontSize="9" fontFamily="JetBrains Mono">
            UNDERWATER DRAWDOWN (%)
          </text>

          {/* Benchmark line */}
          <path d={benchmarkPath} fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* Strategy Equity curve */}
          <path d={equityPath} fill="none" stroke="#10b981" strokeWidth="2" />

          {/* Drawdown Area */}
          <path d={ddAreaPath} fill="#f43f5e" opacity="0.25" />

          {/* Mandatory Train / Test Boundary Line */}
          {splitX !== null && (
            <g>
              <line
                x1={splitX}
                y1="0"
                x2={splitX}
                y2={height}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              {/* Labels on sides */}
              <text x={splitX - 6} y="20" fill="#38bdf8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono" fontWeight="bold">
                ← TRAIN (In-Sample)
              </text>
              <text x={splitX + 6} y="20" fill="#10b981" fontSize="9" textAnchor="start" fontFamily="JetBrains Mono" fontWeight="bold">
                TEST (Out-of-Sample) →
              </text>
            </g>
          )}

          {/* Crosshair */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1="0"
              x2={getX(hoverIndex)}
              y2={height}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
