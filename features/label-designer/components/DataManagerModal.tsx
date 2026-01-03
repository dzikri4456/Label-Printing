import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useSchema } from '../context/SchemaContext';
import { parseExcel } from '../../../core/excel-engine';
import { LabelTemplate } from '../types';
import { 
  Database, 
  Upload, 
  Trash2, 
  X, 
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Logger } from '../../../core/logger';
import { useToast } from '../../ui/ToastContext';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LabelTemplate;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({ isOpen, onClose, template }) => {
  const { masterData, headers, loadData, clearData } = useData();
  const { syncFromHeaders } = useSchema();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  
  // Use a ref to reset the file input manually
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SCROLL LOCK FIX
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const usedBindingKeys = new Set(
    template.elements
      .filter(el => el.isDynamic && el.bindingKey)
      .map(el => el.bindingKey)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Logger.info('Upload Started', { fileName: file.name, size: file.size });
    setUploadError(null);

    try {
      // Simulate a small delay if file is too small to see loading state, for UX consistency
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await parseExcel(file);
      
      if (result.data.length === 0) {
        throw new Error("File contains no data rows.");
      }

      loadData(result.headers, result.data);
      syncFromHeaders(result.headers);

      Logger.info('Upload Success', { rows: result.data.length });
      addToast(`Successfully uploaded ${result.data.length} records`, "success");

    } catch (err: any) {
      Logger.error('Upload Failed', err);
      const msg = err.message || "Failed to parse Excel file.";
      setUploadError(msg);
      addToast("Upload failed", "error");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              Manage Data Source (MM60)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Upload Excel data to batch print labels.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
          
          {/* TOP ZONE: UPLOAD & STATUS */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Upload Box */}
            <label className={`flex-1 w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-all group relative overflow-hidden ${isUploading ? 'bg-slate-100 border-slate-300 cursor-not-allowed' : 'bg-slate-50 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer'}`}>
              
              {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                    <span className="text-sm font-semibold text-indigo-600">Parsing Excel File...</span>
                </div>
              ) : (
                <>
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700">Click to Upload Excel (.xlsx)</span>
                    <span className="text-xs text-slate-400 mt-1">or drag and drop file here</span>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".xlsx" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                </>
              )}
            </label>

            {/* Status Panel */}
            <div className="w-full sm:w-72 h-32 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</div>
                {masterData.length > 0 ? (
                   <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                     <CheckCircle className="w-5 h-5" />
                     {masterData.length} Records
                   </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <AlertCircle className="w-5 h-5" />
                    No Data Loaded
                  </div>
                )}
              </div>
              
              {masterData.length > 0 && (
                <button 
                  onClick={() => { clearData(); addToast("Data cleared", "info"); }}
                  disabled={isUploading}
                  className="self-end text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Data
                </button>
              )}
            </div>
          </div>

          {uploadError && (
             <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in">
               <AlertCircle className="w-4 h-4" />
               {uploadError}
             </div>
          )}

          {/* TABLE ZONE */}
          <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col bg-slate-50/30">
             <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Data Preview {masterData.length > 0 && "(First 50 Rows)"}</span>
             </div>
             
             <div className="flex-1 overflow-auto relative">
                {masterData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <Database className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Table is Empty</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm text-slate-600">
                      <tr>
                        <th className="px-4 py-3 border-b border-slate-200 w-12 text-center bg-slate-50">#</th>
                        {headers.map((h, i) => {
                          const isBound = usedBindingKeys.has(h);
                          return (
                            <th key={i} className={`px-4 py-3 border-b border-slate-200 whitespace-nowrap bg-white ${isBound ? 'text-emerald-700' : ''}`}>
                              <div className="flex items-center gap-1.5">
                                {isBound && <LinkIcon className="w-3 h-3 text-emerald-500" />}
                                <span className={isBound ? "font-bold" : "font-medium"}>{h}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {masterData.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                          <td className="px-4 py-2 text-center font-mono text-slate-400 bg-slate-50/50 border-r border-slate-100">{idx + 1}</td>
                          {headers.map((h, i) => (
                            <td key={i} className="px-4 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-slate-600">
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-95"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};