import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useSchema } from '../context/SchemaContext';
import { parseExcel } from '../../../core/excel-engine';
import { Upload, X, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Logger } from '../../../core/logger';

interface DataManagerProps {
  onClose: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ onClose }) => {
  const { masterData, headers, loadData, clearData, isLoading } = useData();
  const { syncFromHeaders } = useSchema();
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const result = await parseExcel(file);
      
      // 1. Load Data into Data Context
      loadData(result.headers, result.data);
      
      // 2. Sync Schema (Create buttons for Drag & Drop)
      syncFromHeaders(result.headers);

    } catch (err) {
      Logger.error('Excel Upload Failed', err);
      setError("Failed to parse Excel file. Ensure it is a valid .xlsx file.");
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <DatabaseIcon className="w-6 h-6 text-indigo-600" />
              Data Engine (MM60 Integration)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Upload Excel data to simulate printing multiple records.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm transition-all active:scale-95">
                <Upload className="w-4 h-4" />
                <span className="font-semibold text-sm">Upload Excel (.xlsx)</span>
                <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} />
              </label>
              
              {masterData.length > 0 && (
                <button 
                  onClick={clearData}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </button>
              )}
            </div>

            <div className="text-sm text-slate-500 font-mono">
              {masterData.length} records loaded
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Data Table Preview */}
          <div className="flex-1 border border-slate-200 rounded-lg overflow-auto relative">
             {masterData.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                 <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                 <p>No data loaded.</p>
                 <p className="text-xs">Upload an Excel file to see preview here.</p>
               </div>
             ) : (
               <table className="w-full text-sm text-left text-slate-600">
                 <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-6 py-3 border-b">#</th>
                     {headers.map((h, i) => (
                       <th key={i} className="px-6 py-3 border-b whitespace-nowrap">{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {masterData.slice(0, 50).map((row, idx) => (
                     <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                       <td className="px-6 py-2 font-mono text-xs text-slate-400">{idx + 1}</td>
                       {headers.map((h, i) => (
                         <td key={i} className="px-6 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                            {/* We sanitized the key for binding, but headers array has original names. 
                                We need to use the original header to lookup data in the row object 
                                because excel-engine stores it that way. 
                            */}
                            {row[h] || '-'}
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
          {masterData.length > 50 && (
             <p className="text-xs text-center text-slate-400 mt-2 italic">Showing first 50 rows only.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Icon Component
const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);