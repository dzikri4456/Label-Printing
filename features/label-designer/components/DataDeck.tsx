import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useSchema } from '../context/SchemaContext';
import { parseExcel } from '../../../core/excel-engine';
import { LabelTemplate } from '../types';
import { 
  Database, 
  Upload, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Link as LinkIcon 
} from 'lucide-react';
import { Logger } from '../../../core/logger';

interface DataDeckProps {
  template: LabelTemplate;
}

export const DataDeck: React.FC<DataDeckProps> = ({ template }) => {
  const { masterData, headers, selectedIndex, setSelectedIndex, loadData, clearData } = useData();
  const { syncFromHeaders } = useSchema();
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Extract all binding keys used in the current template
  const usedBindingKeys = new Set(
    template.elements
      .filter(el => el.isDynamic && el.bindingKey)
      .map(el => el.bindingKey)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError(null);
      const result = await parseExcel(file);
      loadData(result.headers, result.data);
      syncFromHeaders(result.headers);
      setIsExpanded(true); // Auto expand on success
    } catch (err) {
      Logger.error('Data Deck Upload Failed', err);
      setUploadError("Failed to parse Excel.");
    }
  };

  return (
    <div className="border-b border-slate-200 bg-white shadow-sm z-20 flex flex-col no-print transition-all">
      {/* HEADER BAR */}
      <div 
        className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${masterData.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Data Source (MM60)</h2>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              {masterData.length > 0 ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {masterData.length} Records Loaded
                </span>
              ) : (
                "No data loaded"
              )}
            </div>
          </div>
        </div>
        
        <button className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* EXPANDABLE BODY */}
      {isExpanded && (
        <div className="flex flex-col md:flex-row h-64 animate-in slide-in-from-top-2 duration-200">
          
          {/* LEFT: ACTIONS */}
          <div className="w-full md:w-64 p-4 border-r border-slate-200 bg-slate-50/50 flex flex-col gap-3 shrink-0">
            <label className="flex flex-col items-center justify-center flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all group p-4 text-center">
              <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2" />
              <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700">Upload Excel (.xlsx)</span>
              <span className="text-[10px] text-slate-400 mt-1">Drag & drop or click</span>
              <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} />
            </label>
            
            {masterData.length > 0 && (
              <button 
                onClick={clearData}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-bold transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Clear Data
              </button>
            )}
            
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          </div>

          {/* RIGHT: DATA TABLE */}
          <div className="flex-1 overflow-auto bg-white relative">
            {masterData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Database className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Data Table Empty</p>
                <p className="text-xs">Upload a file to see records here.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200 w-10 text-center">#</th>
                    {headers.map((h, i) => {
                      const isBound = usedBindingKeys.has(h);
                      return (
                        <th key={i} className={`px-4 py-3 border-b border-slate-200 whitespace-nowrap ${isBound ? 'text-emerald-700 bg-emerald-50/50' : ''}`}>
                          <div className="flex items-center gap-1.5">
                            {isBound && <LinkIcon className="w-3 h-3" />}
                            {h}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {masterData.slice(0, 50).map((row, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedIndex(idx)}
                      className={`cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-indigo-50 text-indigo-900 font-medium' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      {headers.map((h, i) => (
                        <td key={i} className="px-4 py-2 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {masterData.length > 50 && (
              <div className="sticky bottom-0 bg-white/90 backdrop-blur p-2 text-center text-xs text-slate-400 border-t border-slate-100">
                Displaying first 50 records only for performance.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};