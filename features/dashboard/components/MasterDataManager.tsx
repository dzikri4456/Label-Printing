import React, { useState, useEffect, useRef } from 'react';
import { ExcelServiceFactory } from '../../../core/services/excel';
import { productRepository, Product, ProductMetadata } from '../../products/product-repository';
import { Upload, Database, Trash2, AlertTriangle, CheckCircle, Loader2, FileText, Calendar, Download } from 'lucide-react';
import { useToast } from '../../ui/ToastContext';
import { Logger } from '../../../core/logger';

export const MasterDataManager: React.FC = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState({ count: 0 });
  const [meta, setMeta] = useState<ProductMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = () => {
    setStats({ count: productRepository.count() });
    setMeta(productRepository.getMetadata());
  };

  const handleClearDatabase = () => {
    if (confirm("DANGER: This will delete ALL Master Data. This action cannot be undone. Are you sure?")) {
      productRepository.clear();
      // FORCE RELOAD to ensure strict state cleanup
      window.location.reload();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const excelService = ExcelServiceFactory.getService();
      const result = await excelService.parseToJSON(file);
      const jsonData = result.data;

      if (jsonData.length === 0) {
        throw new Error("Excel file is empty.");
      }

      // MAPPING LOGIC
      const mappedProducts: Product[] = jsonData.map((row: any) => {
        const getVal = (keys: string[]) => {
          for (const k of Object.keys(row)) {
            if (keys.includes(k.toLowerCase().trim())) return row[k];
          }
          return '';
        };

        const code = getVal(['material', 'material number', 'code', 'item code', 'part no', 'matnr']);
        const name = getVal(['material description', 'description', 'name', 'item name', 'desc']);
        const uom = getVal(['base unit of measure', 'unit', 'uom', 'bun', 'satuan']);

        if (!code) return null;

        return {
          code: String(code).trim(),
          name: String(name).trim(),
          uom: String(uom).trim().toUpperCase()
        };
      }).filter((p): p is Product => p !== null);

      if (mappedProducts.length === 0) {
        throw new Error("No valid data found. Check your Excel headers (Required: Material, Description, Unit).");
      }

      productRepository.saveBulk(mappedProducts, file.name);
      refreshStats();
      addToast(`Successfully imported ${mappedProducts.length} items from ${file.name}.`, "success");

      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      Logger.error("Master Data Upload Failed", err);
      addToast(err.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Master Data Database
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The central source of truth for all products.
          </p>
        </div>
      </div>

      <div className="p-8">
        {stats.count === 0 ? (
          <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-100 border-dashed mb-8">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-amber-800">Database Empty</h3>
            <p className="text-amber-700/80 max-w-md mx-auto mt-2">
              The system currently has no product data. Search functions in the Print Station will fail until data is uploaded.
            </p>
          </div>
        ) : (
          <div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="bg-emerald-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-100 min-w-[150px]">
              <div className="text-center">
                <div className="mx-auto bg-white p-3 rounded-full shadow-sm mb-2 w-fit">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-700">{stats.count.toLocaleString()}</div>
                <div className="text-xs font-bold text-emerald-600 uppercase">Records</div>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm">File: <strong>{meta?.filename || 'Unknown'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Updated: {meta?.lastUpdated ? formatDate(meta.lastUpdated) : '-'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UPLOAD CARD */}
          <div className="border rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">.XLSX</div>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Import Database</h3>
            <div className="text-sm text-slate-500 mb-6">
              Upload a new Excel file to replace the current database.
              <br />
              <span className="mt-2 block">
                Don't have a file?
                <a
                  href="/sample_data.xlsx"
                  download="Sample_Data_PLA.xlsx"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold ml-1 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                  Download Sample
                </a>
              </span>
            </div>

            <label className={`block w-full text-center py-3 rounded-lg font-bold transition-all cursor-pointer ${isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Select Excel File"
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* DANGER CARD */}
          <div className="border rounded-xl p-6 border-red-100 hover:border-red-300 hover:bg-red-50/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Trash2 className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Clear Database</h3>
            <p className="text-sm text-slate-500 mb-6">
              Permanently delete all master data records. This is useful for troubleshooting "Zombie Data" issues.
            </p>

            <button
              onClick={handleClearDatabase}
              disabled={stats.count === 0}
              className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete All Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};