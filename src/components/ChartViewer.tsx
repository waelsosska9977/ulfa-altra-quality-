import React, { useState, useMemo } from 'react';
import { Candle, IndicatorValues } from '../types/quant';
import { calculateEMA, calculateVWAP } from '../lib/indicators';

interface ChartViewerProps {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({
  symbol,
  timeframe,
  candles,
  entryPrice,
  stopLoss,
  takeProfit,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Take the most recent ~80 candles for crisp visibility
  const visibleCandles = useMemo(() => {
    return candles.slice(-80);
  }, [candles]);

  const { closes, vwap, ema9, ema21, ema50, minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { closes: [], vwap: [], ema9: [], ema21: [], ema50: [], minPrice: 0, maxPrice: 1, maxVolume: 1 };
    }
    const c = visibleCandles.map(x => x.close);
    const e9 = calculateEMA(c, 9);
    const e21 = calculateEMA(c, 21);
    const e50 = calculateEMA(c, 50);
    const { vwap: v } = calculateVWAP(visibleCandles);

    let min = Infinity;
    let max = -Infinity;
    let maxV = 0;

    for (const candle of visibleCandles) {
      if (candle.low < min) min = candle.low;
      if (candle.high > max) max = candle.high;
      if (candle.volume > maxV) maxV = candle.volume;
    }

    if (stopLoss && stopLoss < min) min = stopLoss * 0.998;
    if (takeProfit && takeProfit > max) max = takeProfit * 1.002;

    const padding = (max - min) * 0.08 || 1;
    return {
      closes: c,
      vwap: v,
      ema9: e9,
      ema21: e21,
      ema50: e50,
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVolume: maxV || 1,
    };
  }, [visibleCandles, stopLoss, takeProfit]);

  if (visibleCandles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
        No chart data available
      </div>
    );
  }

  const width = 800;
  const height = 340;
  const volumeHeight = 60;
  const chartHeight = height - volumeHeight - 30;

  const getX = (idx: number) => (idx / (visibleCandles.length - 1 || 1)) * (width - 60) + 10;
  const getY = (val: number) => chartHeight - ((val - minPrice) / (maxPrice - minPrice || 1)) * chartHeight + 10;
  const getVolY = (vol: number) => height - 10 - ((vol / (maxVolume || 1)) * volumeHeight);

  // SVG paths for indicators
  const vwapPath = visibleCandles
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(vwap[i]).toFixed(1)}`)
    .join(' ');

  const ema9Path = visibleCandles
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(ema9[i]).toFixed(1)}`)
    .join(' ');

  const ema21Path = visibleCandles
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(ema21[i]).toFixed(1)}`)
    .join(' ');

  const ema50Path = visibleCandles
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(ema50[i]).toFixed(1)}`)
    .join(' ');

  const hoveredCandle = hoverIndex !== null ? visibleCandles[hoverIndex] : visibleCandles[visibleCandles.length - 1];

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-white text-sm">{symbol}</span>
          <span className="text-slate-400 font-mono font-medium">{timeframe}</span>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
            <span className="text-cyan-400">EMA9: {ema9[ema9.length - 1]?.toFixed(2)}</span>
            <span className="text-amber-400">EMA21: {ema21[ema21.length - 1]?.toFixed(2)}</span>
            <span className="text-purple-400">EMA50: {ema50[ema50.length - 1]?.toFixed(2)}</span>
            <span className="text-yellow-300">VWAP: {vwap[vwap.length - 1]?.toFixed(2)}</span>
          </div>
        </div>

        {hoveredCandle && (
          <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-slate-300">
            <span>O: <strong className="text-white">{hoveredCandle.open}</strong></span>
            <span>H: <strong className="text-white">{hoveredCandle.high}</strong></span>
            <span>L: <strong className="text-white">{hoveredCandle.low}</strong></span>
            <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{hoveredCandle.close}</strong></span>
            <span className="text-slate-500">Vol: {hoveredCandle.volume.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.min(
              visibleCandles.length - 1,
              Math.max(0, Math.round(relX * (visibleCandles.length - 1)))
            );
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Subtle Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio + 10;
            const price = maxPrice - (maxPrice - minPrice) * ratio;
            return (
              <g key={ratio}>
                <line x1="0" y1={y} x2={width - 55} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={width - 50} y={y + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                  {price.toFixed(price < 1 ? 4 : 2)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator */}
          <line x1="0" y1={chartHeight + 15} x2={width} y2={chartHeight + 15} stroke="#1e293b" />
          <text x="10" y={chartHeight + 28} fill="#475569" fontSize="9" fontFamily="JetBrains Mono">
            VOLUME & TURNOVER
          </text>

          {/* Volume Bars */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isBull = c.close >= c.open;
            const y = getVolY(c.volume);
            const barH = height - 10 - y;
            return (
              <rect
                key={`vol_${i}`}
                x={x - 2}
                y={y}
                width="4"
                height={Math.max(1, barH)}
                fill={isBull ? '#059669' : '#dc2626'}
                opacity="0.4"
              />
            );
          })}

          {/* Candlesticks */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isBull = c.close >= c.open;
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const color = isBull ? '#10b981' : '#f43f5e';
            const top = Math.min(yOpen, yClose);
            const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));

            return (
              <g key={`candle_${i}`}>
                {/* Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect
                  x={x - 3}
                  y={top}
                  width="6"
                  height={bodyH}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                />
              </g>
            );
          })}

          {/* Technical Indicator Curves */}
          <path d={ema50Path} fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.8" />
          <path d={ema21Path} fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.85" />
          <path d={ema9Path} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
          <path d={vwapPath} fill="none" stroke="#facc15" strokeWidth="1.6" strokeDasharray="4 2" />

          {/* Entry Level & Target Lines */}
          {entryPrice && entryPrice >= minPrice && entryPrice <= maxPrice && (
            <g>
              <rect
                x="0"
                y={getY(entryPrice) - 6}
                width={width - 55}
                height="12"
                fill="#06b6d4"
                opacity="0.12"
              />
              <line
                x1="0"
                y1={getY(entryPrice)}
                x2={width - 55}
                y2={getY(entryPrice)}
                stroke="#06b6d4"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <text x={width - 52} y={getY(entryPrice) + 3} fill="#06b6d4" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                ENTRY: {entryPrice.toFixed(entryPrice < 1 ? 4 : 2)}
              </text>
            </g>
          )}

          {/* TP & SL target lines if active */}
          {takeProfit && takeProfit >= minPrice && takeProfit <= maxPrice && (
            <g>
              <line
                x1="0"
                y1={getY(takeProfit)}
                x2={width - 55}
                y2={getY(takeProfit)}
                stroke="#10b981"
                strokeDasharray="4 2"
                strokeWidth="1.2"
              />
              <text x={width - 52} y={getY(takeProfit) + 3} fill="#10b981" fontSize="9" fontFamily="JetBrains Mono">
                TP: {takeProfit.toFixed(takeProfit < 1 ? 4 : 2)}
              </text>
            </g>
          )}

          {stopLoss && stopLoss >= minPrice && stopLoss <= maxPrice && (
            <g>
              <line
                x1="0"
                y1={getY(stopLoss)}
                x2={width - 55}
                y2={getY(stopLoss)}
                stroke="#f43f5e"
                strokeDasharray="4 2"
                strokeWidth="1.2"
              />
              <text x={width - 52} y={getY(stopLoss) + 3} fill="#f43f5e" fontSize="9" fontFamily="JetBrains Mono">
                SL: {stopLoss.toFixed(stopLoss < 1 ? 4 : 2)}
              </text>
            </g>
          )}

          {/* Crosshair on hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1="0"
                x2={getX(hoverIndex)}
                y2={height}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
