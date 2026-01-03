import React, { useState, useMemo } from 'react';
import { Printer, Layers, FileText, X, AlertTriangle, ShieldAlert, List } from 'lucide-react';
import { PRINT_CONFIG } from '../../../core/constants';

interface BatchPrintModalProps {
  totalRecords: number;
  onPrintCurrent: () => void;
  onPrintBatch: (startIndex: number, endIndex: number) => void;
  onClose: () => void;
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({ 
  totalRecords, 
  onPrintCurrent, 
  onPrintBatch, 
  onClose 
}) => {
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);
  const [showCrashWarning, setShowCrashWarning] = useState(false);

  // Calculate Batches
  const batches = useMemo(() => {
    const batchCount = Math.ceil(totalRecords / PRINT_CONFIG.BATCH_SIZE);
    return Array.from({ length: batchCount }, (_, i) => {
      const start = i * PRINT_CONFIG.BATCH_SIZE;
      const end = Math.min((i + 1) * PRINT_CONFIG.BATCH_SIZE, totalRecords);
      return {
        label: `Batch ${i + 1} (Records ${start + 1} - ${end})`,
        start,
        end,
        count: end - start
      };
    });
  }, [totalRecords]);

  const handlePrintBatch = () => {
    const batch = batches[selectedBatchIndex];
    if (batch) {
      onPrintBatch(batch.start, batch.end);
    }
  };

  const handlePrintAllAttempt = () => {
    if (totalRecords > PRINT_CONFIG.WARNING_THRESHOLD) {
      setShowCrashWarning(true);
    } else {
      onPrintBatch(0, totalRecords);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            Print Manager
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-red-500"/></button>
        </div>

        {/* HIGH VOLUME WARNING OVERLAY */}
        {showCrashWarning ? (
           <div className="p-6 bg-red-50 h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-4 text-red-700">
                 <ShieldAlert className="w-8 h-8" />
                 <h3 className="font-bold text-lg">High Volume Warning</h3>
              </div>
              <p className="text-sm text-red-800 mb-4 leading-relaxed">
                 You are attempting to print <strong>{totalRecords} labels</strong> at once. 
                 This requires significant browser memory and may cause the tab to freeze or crash.
              </p>
              <div className="bg-white p-3 rounded border border-red-200 text-xs text-red-600 mb-6">
                 <strong>Recommendation:</strong> Use "Print Batch" to print {PRINT_CONFIG.BATCH_SIZE} labels at a time for better stability.
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowCrashWarning(false)}
                   className="flex-1 py-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => onPrintBatch(0, totalRecords)}
                   className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-200"
                 >
                   Print Anyway
                 </button>
              </div>
           </div>
        ) : (
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-500">
              Source contains <strong>{totalRecords} records</strong>. Choose output method:
            </p>

            {/* OPTION 1: CURRENT RECORD */}
            <button 
              onClick={onPrintCurrent}
              className="w-full p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group text-left bg-white"
            >
              <div className="bg-slate-50 p-3 rounded-full border border-slate-200 group-hover:border-indigo-200 shadow-sm">
                <FileText className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-indigo-700">Print Single Record</div>
                <div className="text-xs text-slate-500">Only print the label currently shown in preview.</div>
              </div>
            </button>

            {/* OPTION 2: BATCH PRINT (Recommended) */}
            <div className="border rounded-xl p-4 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-colors">
               <div className="flex items-start gap-4 mb-3">
                  <div className="bg-white p-3 rounded-full border border-slate-200 shadow-sm">
                    <List className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Print by Batch</div>
                    <div className="text-xs text-emerald-600 font-semibold mt-0.5">Recommended for stability</div>
                  </div>
               </div>
               
               <div className="flex gap-2 pl-[52px]">
                  <select 
                    value={selectedBatchIndex}
                    onChange={(e) => setSelectedBatchIndex(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                     {batches.map((b, i) => (
                       <option key={i} value={i}>{b.label}</option>
                     ))}
                  </select>
                  <button 
                    onClick={handlePrintBatch}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-transform active:scale-95"
                  >
                    Print
                  </button>
               </div>
            </div>

            {/* OPTION 3: PRINT ALL */}
            <button 
              onClick={handlePrintAllAttempt}
              className="w-full p-4 border rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center gap-4 group text-left bg-white"
            >
              <div className="bg-slate-50 p-3 rounded-full border border-slate-200 group-hover:border-amber-200 shadow-sm">
                <Layers className="w-5 h-5 text-slate-600 group-hover:text-amber-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-amber-700">Print All Records</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  {totalRecords > PRINT_CONFIG.WARNING_THRESHOLD && <AlertTriangle className="w-3 h-3 text-amber-500"/>}
                  Process {totalRecords} labels at once.
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};