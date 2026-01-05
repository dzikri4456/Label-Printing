import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTemplateContext } from '../label-designer/context/TemplateContext';
import { useUser } from '../users/UserContext';
import { productRepository, Product } from '../products/product-repository';
import { StaticLabelRenderer } from '../label-designer/components/StaticLabelRenderer';
import { LabelCanvas } from '../label-designer/components/LabelCanvas';
import { ArrowLeft, Printer, Search, Package, X, ScanBarcode, AlertOctagon, FileText, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import { SYSTEM_KEYS } from '../../core/schema-registry';
import { LabelElementData } from '../label-designer/types';
import { formatValue } from '../../core/print-utils';

interface PrintStationProps {
  onBack: () => void;
}

export const PrintStation: React.FC<PrintStationProps> = ({ onBack }) => {
  const { activeTemplate } = useTemplateContext();
  const { currentUser, departments } = useUser();
  const { addToast } = useToast();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // DYNAMIC INPUT STATE
  const [inputQty, setInputQty] = useState('');
  const [inputSales, setInputSales] = useState('');
  const [inputPlan, setInputPlan] = useState('');
  const [inputRemarks, setInputRemarks] = useState('');
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Preview Scaling State
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // --- ANALYZE TEMPLATE FOR REQUIRED INPUTS ---
  const requiredFields = useMemo(() => {
    if (!activeTemplate) return { qty: false, sales: false, plan: false, remarks: false };
    const keys = new Set(activeTemplate.elements.map(e => e.bindingKey));
    return {
        qty: keys.has(SYSTEM_KEYS.INPUT_QTY),
        sales: keys.has(SYSTEM_KEYS.INPUT_SALES),
        plan: keys.has(SYSTEM_KEYS.INPUT_PLAN),
        remarks: keys.has(SYSTEM_KEYS.INPUT_REMARKS)
    };
  }, [activeTemplate]);

  // Initialize Master Data
  useEffect(() => {
    productRepository.initialize();
  }, []);

  // --- AUTO SCALING PREVIEW ---
  useEffect(() => {
    const calculateScale = () => {
      if (previewContainerRef.current && activeTemplate) {
        const { clientWidth, clientHeight } = previewContainerRef.current;
        const padding = 20;
        const availableWidth = clientWidth - padding;
        const availableHeight = clientHeight - padding;
        const templateWidthPx = activeTemplate.width * 3.78;
        const templateHeightPx = activeTemplate.height * 3.78;
        const scaleX = availableWidth / templateWidthPx;
        const scaleY = availableHeight / templateHeightPx;
        setScale(Math.min(scaleX, scaleY, 0.85));
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [activeTemplate]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    if (selectedProduct && searchQuery === selectedProduct.code) return; 

    const results = productRepository.search(searchQuery);
    setSearchResults(results);
    setIsDropdownOpen(results.length > 0 || searchQuery.length > 1);
  }, [searchQuery, selectedProduct]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeTemplate) return null;

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.code);
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setInputQty('');
    setInputSales('');
    setInputPlan('');
    setInputRemarks('');
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handlePrint = () => {
    if (!selectedProduct) {
        addToast("Please select a product first", "error");
        return;
    }
    if (requiredFields.qty && !inputQty) {
        addToast("Quantity is required", "error");
        return;
    }
    window.print();
  };

  // --- PREVIEW RESOLVER ---
  const resolveSystemVariable = useCallback((key: string): string => {
    switch(key) {
        case SYSTEM_KEYS.OPERATOR_NAME: return currentUser?.name || '';
        case SYSTEM_KEYS.INPUT_QTY: return inputQty || '0';
        case SYSTEM_KEYS.INPUT_SALES: return inputSales || '[Sales Order]';
        case SYSTEM_KEYS.INPUT_PLAN: return inputPlan || '[Plan]';
        case SYSTEM_KEYS.INPUT_REMARKS: return inputRemarks || '[Remarks]';
        case SYSTEM_KEYS.VAR_DATE_ONLY: return new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy
        case SYSTEM_KEYS.VAR_DEPT: 
            const dept = departments.find(d => d.id === currentUser?.departmentId);
            return dept?.name || 'General';
        default: return '';
    }
  }, [currentUser, departments, inputQty, inputSales, inputPlan, inputRemarks]);

  const getPreviewDisplayValue = useCallback((element: LabelElementData): string => {
    if (element.isDynamic && element.bindingKey) {
      if (element.bindingKey.startsWith('__SYS_')) {
          return resolveSystemVariable(element.bindingKey);
      }
      if (!selectedProduct) return element.value;
      
      switch (element.bindingKey) {
          case 'material': return selectedProduct.code;
          case 'material_description': return selectedProduct.name;
          case 'base_unit_of_measure': return selectedProduct.uom;
          default: return '';
      }
    }
    return element.value;
  }, [selectedProduct, resolveSystemVariable]);

  // Data Row for Print
  const printDataRow = selectedProduct ? {
      material: selectedProduct.code,
      material_description: selectedProduct.name,
      base_unit_of_measure: selectedProduct.uom,
      [SYSTEM_KEYS.INPUT_QTY]: inputQty || '0',
      [SYSTEM_KEYS.INPUT_SALES]: inputSales,
      [SYSTEM_KEYS.INPUT_PLAN]: inputPlan,
      [SYSTEM_KEYS.INPUT_REMARKS]: inputRemarks,
      [SYSTEM_KEYS.OPERATOR_NAME]: currentUser?.name || '',
      [SYSTEM_KEYS.VAR_DATE_ONLY]: new Date().toLocaleDateString('en-GB'),
      [SYSTEM_KEYS.VAR_DEPT]: departments.find(d => d.id === currentUser?.departmentId)?.name || 'General'
  } : {};

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <style>
        {`
          @media print {
            @page {
              size: ${activeTemplate.width}mm ${activeTemplate.height}mm;
              margin: 0mm;
            }
            body > * { display: none !important; }
            #station-print-container { 
              display: block !important; 
              position: absolute;
              top: 0; left: 0;
            }
          }
        `}
      </style>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-30">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-indigo-600" />
                    Print Station
                </h1>
                <p className="text-xs text-slate-500">Template: {activeTemplate.name}</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-indigo-700">{currentUser?.name}</span>
         </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* INPUT FORM */}
        <div className="w-full md:w-1/2 lg:w-5/12 p-6 overflow-y-auto flex flex-col gap-6 bg-white border-r border-slate-200 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            
            {/* 1. PRODUCT SEARCH */}
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    1. Select Product
                </label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <input 
                        ref={searchInputRef}
                        autoFocus
                        disabled={!!selectedProduct}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchQuery.trim().length > 0 && !selectedProduct) setIsDropdownOpen(true); }}
                        className={`w-full pl-12 pr-10 py-4 text-lg bg-slate-50 border-2 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium ${selectedProduct ? 'border-indigo-100 bg-indigo-50/30 text-slate-500 cursor-not-allowed' : 'border-slate-200 focus:border-indigo-500 focus:bg-white focus:shadow-md'}`}
                        placeholder="Search Material..."
                    />
                    {selectedProduct && (
                        <button onClick={handleClearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    )}
                </div>
                {/* Search Dropdown Logic same as before... */}
                 {isDropdownOpen && !selectedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto z-50">
                        {searchResults.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {searchResults.map((product) => (
                                    <li key={product.code} onClick={() => handleSelectProduct(product)} className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">{product.code}</span>
                                            <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded">{product.uom}</span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-700">{product.name}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-slate-500"><AlertOctagon className="w-8 h-8 mx-auto mb-2 text-red-400" /><h3 className="font-bold text-slate-700">Not Found</h3></div>
                        )}
                    </div>
                )}
            </div>

            {selectedProduct && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="bg-white border-l-4 border-indigo-500 pl-4 py-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Selected</label>
                        <div className="text-lg font-bold text-slate-800 leading-tight mt-1">{selectedProduct.name}</div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">ID: {selectedProduct.code} • Unit: {selectedProduct.uom}</div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                             <FileText className="w-4 h-4 text-indigo-500" />
                             <h3 className="text-sm font-bold text-slate-700">Label Input Data</h3>
                        </div>

                        {/* DYNAMIC FORM GENERATION */}
                        {requiredFields.qty && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                                <div className="relative">
                                    <input type="number" value={inputQty} onChange={(e) => setInputQty(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-xl text-slate-800" placeholder="0" />
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        )}

                        {requiredFields.sales && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sales Order</label>
                                <div className="relative">
                                    <input type="text" value={inputSales} onChange={(e) => setInputSales(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 outline-none" placeholder="e.g. SO-2023-001" />
                                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        )}

                        {requiredFields.plan && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan / Batch</label>
                                <div className="relative">
                                    <input type="text" value={inputPlan} onChange={(e) => setInputPlan(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 outline-none" placeholder="e.g. Batch A" />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        )}

                        {requiredFields.remarks && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keterangan (Remarks)</label>
                                <textarea value={inputRemarks} onChange={(e) => setInputRemarks(e.target.value)} rows={2} className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-sm" placeholder="Additional notes..." />
                            </div>
                        )}
                    </div>

                    <button onClick={handlePrint} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4">
                        <Printer className="w-6 h-6" />
                        PRINT LABEL
                    </button>
                </div>
            )}
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <div className="flex-1 bg-slate-100 relative flex flex-col">
           <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-500 flex items-center gap-2">
              <ScanBarcode className="w-3 h-3" />
              Visual Confirmation
           </div>
           <div className="flex-1 flex items-center justify-center p-8 overflow-hidden" ref={previewContainerRef}>
              <div style={{ transform: `scale(${scale})`, transition: 'transform 0.3s' }} className="origin-center shadow-2xl rounded bg-white ring-1 ring-black/5">
                 <LabelCanvas 
                    template={activeTemplate}
                    selectedId={null}
                    isPreviewMode={true}
                    onCanvasClick={() => {}} 
                    onElementMouseDown={() => {}} 
                    onResizeMouseDown={() => {}} 
                    onElementDoubleClick={() => {}} 
                    onDropFromSidebar={() => {}}
                    getElementDisplayValue={getPreviewDisplayValue}
                 />
              </div>
           </div>
        </div>
      </div>

      <div id="station-print-container" className="hidden print:block fixed inset-0">
          <StaticLabelRenderer template={activeTemplate} row={printDataRow} />
      </div>
    </div>
  );
};