import React, { useState } from 'react';
import { Download, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { TradeRecord } from '../types/quant';
import { Language, translations } from '../i18n/translations';

interface TradeLogTableProps {
  trades: TradeRecord[];
  symbol: string;
  lang: Language;
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades, symbol, lang }) => {
  const t = translations[lang];
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const totalPages = Math.ceil(trades.length / pageSize) || 1;
  const paginatedTrades = trades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    if (trades.length === 0) return;
    const headers = [
      'Trade ID',
      'Entry Time',
      'Exit Time',
      'Direction',
      'Entry Price',
      'Exit Price',
      'PnL Dollar',
      'PnL Percent',
      'Fee Paid',
      'Bars Held',
      'Exit Reason',
      'Sample Type'
    ];
    const rows = trades.map(t => [
      t.id,
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
      t.direction,
      t.entryPrice.toFixed(4),
      t.exitPrice.toFixed(4),
      t.pnlDollar.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.feePaid.toFixed(2),
      t.barsHeld,
      t.exitReason,
      t.sampleType
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${symbol}_backtest_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800 rounded-xl overflow-hidden space-y-2">
      {/* Table Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-bold text-white">{t.tradesLog}</span>
          <span className="text-xs text-slate-400 ms-2 font-mono">
            ({trades.length} {lang === 'ar' ? 'صفقة مسجلة' : 'executed trades'})
          </span>
        </div>
        <button
          onClick={exportCsv}
          disabled={trades.length === 0}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportCsv}</span>
        </button>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] font-semibold">
              <th className="py-2.5 px-4">{t.tradeId}</th>
              <th className="py-2.5 px-3">{t.direction}</th>
              <th className="py-2.5 px-3 text-right">{t.entryPrice}</th>
              <th className="py-2.5 px-3 text-right">{t.exitPrice}</th>
              <th className="py-2.5 px-3 text-right">{t.pnlPct}</th>
              <th className="py-2.5 px-3 text-right">{t.netProfit}</th>
              <th className="py-2.5 px-3 text-right">{t.feesPaid}</th>
              <th className="py-2.5 px-3 text-center">{t.holdingBars}</th>
              <th className="py-2.5 px-3">{t.exitReason}</th>
              <th className="py-2.5 px-4 text-center">{t.sampleType}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No trades executed with current confluence parameters.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((trade) => {
                const isProfit = trade.pnlDollar > 0;
                return (
                  <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-400">
                      {trade.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        trade.direction === 'LONG' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                      }`}>
                        {trade.direction === 'LONG' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                      <div>${trade.entryPrice < 1 ? trade.entryPrice.toFixed(6) : trade.entryPrice.toFixed(2)}</div>
                      {trade.entryMechanism && (
                        <div className="text-[9px] text-slate-500 font-sans">
                          {trade.entryMechanism === 'VWAP_ANCHOR_CONFLUENCE' ? 'VWAP Anchor' :
                           trade.entryMechanism === 'EMA9_PULLBACK_ANCHOR' ? 'EMA9 Anchor' :
                           trade.entryMechanism === 'EMA_CROSS_50PCT_EQUILIBRIUM' ? 'P-Cross 50%' :
                           'OTE 50%'}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                      ${trade.exitPrice < 1 ? trade.exitPrice.toFixed(6) : trade.exitPrice.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isProfit ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isProfit ? '+' : ''}${trade.pnlDollar.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                      ${trade.feePaid.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-400">
                      {trade.barsHeld}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {trade.exitReason === 'TAKE_PROFIT' ? 'Target Profit' :
                       trade.exitReason === 'STOP_LOSS' ? 'Stop Loss' :
                       trade.exitReason === 'SIGNAL_FLIP' ? 'Signal Flip' : 'End Sample'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        trade.sampleType === 'IN_SAMPLE'
                          ? 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                          : 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {trade.sampleType === 'IN_SAMPLE' ? 'TRAIN' : 'TEST'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
