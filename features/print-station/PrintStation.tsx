import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTemplateContext } from '../label-designer/context/TemplateContext';
import { useUser } from '../users/UserContext';
import { productRepository, Product } from '../products/product-repository';
import { StaticLabelRenderer } from '../label-designer/components/StaticLabelRenderer';
import { LabelCanvas } from '../label-designer/components/LabelCanvas';
import { ArrowLeft, Printer, Search, Package, X, ChevronDown, ScanBarcode, AlertOctagon } from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import { Logger } from '../../core/logger';
import { SYSTEM_KEYS } from '../../core/schema-registry';
import { LabelElementData } from '../label-designer/types';
import { formatValue } from '../../core/print-utils';

interface PrintStationProps {
  onBack: () => void;
}

export const PrintStation: React.FC<PrintStationProps> = ({ onBack }) => {
  const { activeTemplate } = useTemplateContext();
  const { currentUser } = useUser();
  const { addToast } = useToast();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Preview Scaling State
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

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
        
        // Approx 3.78 px/mm
        const templateWidthPx = activeTemplate.width * 3.78;
        const templateHeightPx = activeTemplate.height * 3.78;

        const scaleX = availableWidth / templateWidthPx;
        const scaleY = availableHeight / templateHeightPx;
        
        setScale(Math.min(scaleX, scaleY, 0.85)); // Max scale 0.85 for aesthetics
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

    // Only search if we haven't selected a product yet (or if user is modifying search)
    if (selectedProduct && searchQuery === selectedProduct.code) {
        return; 
    }

    const results = productRepository.search(searchQuery);
    setSearchResults(results);
    setIsDropdownOpen(results.length > 0 || searchQuery.length > 1);
  }, [searchQuery, selectedProduct]);

  // Close dropdown when clicking outside
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

  // --- HANDLERS ---

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.code); // Display code in input
    setIsDropdownOpen(false);
    
    // Auto-focus Qty
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 100);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setQty('');
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handlePrint = () => {
    if (!selectedProduct) {
        addToast("Please select a product first", "error");
        return;
    }
    if (!qty) {
        addToast("Quantity is required", "error");
        return;
    }
    window.print();
  };

  // --- ACTION 3: PREVIEW DATA BINDING ---
  // Ensure we map the selected product fields to the exact keys defined in the schema registry.
  const getPreviewDisplayValue = useCallback((element: LabelElementData): string => {
    if (element.isDynamic && element.bindingKey) {
      
      // 1. System Fields
      if (element.bindingKey === SYSTEM_KEYS.OPERATOR_NAME) {
        return currentUser ? currentUser.name : '';
      }
      if (element.bindingKey === SYSTEM_KEYS.INPUT_QTY) {
        return qty || '0';
      }
      
      // 2. Data Fields
      if (!selectedProduct) return element.value; // Show default placeholder if nothing selected

      // MAPPING LOGIC: Product Object -> Schema Key
      switch (element.bindingKey) {
          case 'material': return selectedProduct.code;
          case 'material_description': return selectedProduct.name;
          case 'base_unit_of_measure': return selectedProduct.uom;
          // Note: 'qty' in schema might refer to 'Box Capacity' from master data, not the input qty.
          // We rely on 'input_qty' system key for the dynamic input.
          default: return '';
      }
    }
    return element.value;
  }, [selectedProduct, qty, currentUser]);

  // Construct Data Row for Print Renderer (StaticLabelRenderer)
  // This object mimics a row from Excel, plus system fields
  const printDataRow = selectedProduct ? {
      material: selectedProduct.code,
      material_description: selectedProduct.name,
      base_unit_of_measure: selectedProduct.uom,
      [SYSTEM_KEYS.INPUT_QTY]: qty || '0',
      [SYSTEM_KEYS.OPERATOR_NAME]: currentUser?.name || ''
  } : {};

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* PRINT CSS INJECTION */}
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
                    Smart Print Station
                </h1>
                <p className="text-xs text-slate-500">Template: {activeTemplate.name}</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-bold text-indigo-700">{currentUser?.name}</span>
         </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANEL: INPUT FORM */}
        <div className="w-full md:w-1/2 lg:w-5/12 p-6 overflow-y-auto flex flex-col gap-6 bg-white border-r border-slate-200 z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            
            {/* STEP 1: SEARCH */}
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    1. Search Product
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
                        onFocus={() => {
                            if (searchQuery.trim().length > 0 && !selectedProduct) setIsDropdownOpen(true);
                        }}
                        className={`w-full pl-12 pr-10 py-4 text-lg bg-slate-50 border-2 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium ${
                            selectedProduct 
                            ? 'border-indigo-100 bg-indigo-50/30 text-slate-500 cursor-not-allowed' 
                            : 'border-slate-200 focus:border-indigo-500 focus:bg-white focus:shadow-md'
                        }`}
                        placeholder="Type keywords (e.g. '1100 teak')"
                    />
                    
                    {selectedProduct ? (
                        <button 
                            onClick={handleClearSelection}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                            title="Clear Selection"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        searchQuery.length > 0 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-300">
                                {/* Optional Loader */}
                            </div>
                        )
                    )}
                </div>

                {/* DROPDOWN RESULTS */}
                {isDropdownOpen && !selectedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                        {searchResults.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {searchResults.map((product) => (
                                    <li 
                                        key={product.code}
                                        onClick={() => handleSelectProduct(product)}
                                        className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm group-hover:bg-indigo-100">
                                                {product.code}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 rounded">
                                                {product.uom}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-700 leading-snug">
                                            {product.name}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-slate-500">
                                <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                <h3 className="font-bold text-slate-700">Product Not Found</h3>
                                <p className="text-xs mt-1 max-w-[200px] mx-auto">
                                    No matches for "{searchQuery}". <br/>
                                    Please contact Administrator to update Master Data.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SELECTION DETAILS (Appears after selection) */}
            {selectedProduct && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    
                    <div className="bg-white border-l-4 border-indigo-500 pl-4 py-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Selected Material</label>
                        <div className="text-lg font-bold text-slate-800 leading-tight mt-1">{selectedProduct.name}</div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                            ID: {selectedProduct.code} • Unit: {selectedProduct.uom}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                            2. Input Quantity
                        </label>
                        <div className="relative">
                            <input 
                                ref={qtyInputRef}
                                type="number"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePrint()}
                                className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-white border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800"
                                placeholder="0"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">
                                <Package className="w-6 h-6" />
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {selectedProduct.uom}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePrint}
                        disabled={!qty}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
                    >
                        <Printer className="w-6 h-6" />
                        PRINT LABEL
                    </button>
                </div>
            )}
            
            {!selectedProduct && (
                 <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-sm text-slate-400">Search and select a product to begin.</p>
                 </div>
            )}

        </div>

        {/* RIGHT PANEL: VISUAL CONFIRMATION (PREVIEW) */}
        <div className="flex-1 bg-slate-100 relative flex flex-col">
           <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-500 flex items-center gap-2">
              <ScanBarcode className="w-3 h-3" />
              Visual Confirmation
           </div>

           <div className="flex-1 flex items-center justify-center p-8 overflow-hidden" ref={previewContainerRef}>
              <div 
                 style={{ 
                    transform: `scale(${scale})`, 
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                 }}
                 className="origin-center shadow-2xl rounded bg-white ring-1 ring-black/5"
              >
                 <LabelCanvas 
                    template={activeTemplate}
                    selectedId={null}
                    isPreviewMode={true}
                    onCanvasClick={() => {}}
                    onElementMouseDown={() => {}}
                    onResizeMouseDown={() => {}}
                    onDropFromSidebar={() => {}}
                    getElementDisplayValue={getPreviewDisplayValue}
                 />
              </div>
           </div>
           
           <div className="p-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-slate-50">
              Preview matches the printed output layout. Check details before printing.
           </div>
        </div>

      </div>

      {/* HIDDEN PRINT OUTPUT */}
      <div id="station-print-container" className="hidden print:block fixed inset-0">
          <StaticLabelRenderer 
            template={activeTemplate}
            row={printDataRow}
          />
      </div>

    </div>
  );
};