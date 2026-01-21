import React from 'react';
import { Type, Barcode as BarcodeIcon, Trash2, Database, Lock } from 'lucide-react';
import { LabelElementData, ValueFormat } from '../../types';
import { BufferedInput } from '../BufferedInput';
import { useBarcodeFonts } from '../../../../core/barcode-fonts';

interface PropertyEditorProps {
  element: LabelElementData;
  onUpdate: (id: string, updates: Partial<LabelElementData>) => void;
  onDelete: (id: string) => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ element, onUpdate, onDelete }) => {
  const { fonts: barcodeFonts, loading: fontsLoading } = useBarcodeFonts();

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {element.type === 'text' ? <Type className="w-4 h-4 text-indigo-500" /> : <BarcodeIcon className="w-4 h-4 text-indigo-500" />}
          Edit Properties
        </h3>
        <button
          onClick={() => onDelete(element.id)}
          className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
          title="Delete Element (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {element.isDynamic && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded p-3 text-purple-800 text-xs flex gap-2 items-start">
            <Database className="w-3 h-3 mt-0.5 shrink-0" />
            <div>
              <strong>Bound Field</strong>
              <p className="mt-0.5 opacity-80">Key: <code className="bg-white px-1 rounded border border-purple-100">{element.bindingKey}</code></p>
            </div>
          </div>

          {/* FORMATTING DROPDOWN */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data Format</label>
            <select
              value={element.format || 'none'}
              onChange={(e) => onUpdate(element.id, { format: e.target.value as ValueFormat })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">No Formatting (Text)</option>
              <option value="currency_idr">Currency (IDR)</option>
              <option value="currency_usd">Currency (USD)</option>
              <option value="date_short">Date (Short: DD/MM/YYYY)</option>
              <option value="date_long">Date (Long: DD MMMM YYYY)</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
          Content Value
          {element.isDynamic && <Lock className="w-3 h-3 text-slate-400" />}
        </label>
        <textarea
          value={element.value}
          disabled={element.isDynamic}
          onChange={(e) => onUpdate(element.id, { value: e.target.value })}
          rows={element.type === 'text' ? 3 : 1}
          className={`w-full px-3 py-2 border rounded text-sm outline-none resize-none font-mono ${element.isDynamic ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500'}`}
        />
        {element.isDynamic && (
          <button
            onClick={() => onUpdate(element.id, { isDynamic: false, bindingKey: undefined, schemaLabel: undefined, format: 'none' })}
            className="text-[10px] text-red-500 hover:text-red-700 underline mt-1 block w-full text-right"
          >
            Detach Binding
          </button>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Geometry Inputs (Using BufferedInput) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">X (mm)</label>
          <BufferedInput
            value={Math.round(element.x * 100) / 100}
            onCommit={(val) => onUpdate(element.id, { x: val })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Y (mm)</label>
          <BufferedInput
            value={Math.round(element.y * 100) / 100}
            onCommit={(val) => onUpdate(element.id, { y: val })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Width (mm)</label>
          <BufferedInput
            value={element.width ? Math.round(element.width * 100) / 100 : 0}
            onCommit={(val) => onUpdate(element.id, { width: val > 0 ? val : undefined })}
            min={0}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Height (mm)</label>
          <BufferedInput
            value={element.height ? Math.round(element.height * 100) / 100 : 0}
            onCommit={(val) => onUpdate(element.id, { height: val > 0 ? val : undefined })}
            min={0}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {element.type === 'text' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Size (pt)</label>
              <BufferedInput
                value={element.fontSize || 12}
                onCommit={(val) => onUpdate(element.id, { fontSize: val })}
                min={4}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none"
              />
            </div>
            {/* Font Weight */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Font Weight</label>
              <select
                value={element.fontWeight || 'normal'}
                onChange={(e) => onUpdate(element.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>


          {/* Font Family - Separate Buttons for Regular and Barcode Fonts */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Font Selection</label>

            {/* Check if element is using a barcode font */}
            {(() => {
              // Only working barcode font
              const barcodeFontNames = [
                'LibreBarcode39'       // LibreBarcode39-Regular.ttf - Confirmed working
              ];
              const isUsingBarcodeFont = barcodeFontNames.includes(element.fontFamily || '');

              return (
                <div className="space-y-2">
                  {/* Button Toggle */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdate(element.id, { fontFamily: 'Arial' })}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all ${!isUsingBarcodeFont
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      Font Biasa
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate(element.id, { fontFamily: 'LibreBarcode39' })}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all ${isUsingBarcodeFont
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      Font Barcode
                    </button>
                  </div>

                  {/* Font Dropdown - Shows based on selection */}
                  {isUsingBarcodeFont ? (
                    // Barcode Font Dropdown - Only LibreBarcode39 (Working Font)
                    <select
                      value={element.fontFamily || 'LibreBarcode39'}
                      onChange={(e) => onUpdate(element.id, { fontFamily: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={fontsLoading}
                    >
                      {fontsLoading ? (
                        <option>Loading fonts...</option>
                      ) : (
                        <>
                          <option value="LibreBarcode39">Libre Barcode 39 (Scannable)</option>
                          {barcodeFonts.map((font) => (
                            <option key={font.family} value={font.family}>
                              {font.displayName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  ) : (
                    // Regular Font Dropdown
                    <select
                      value={element.fontFamily || 'Arial'}
                      onChange={(e) => onUpdate(element.id, { fontFamily: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  )}
                </div>
              );
            })()}
          </div>


          {/* Text Alignment */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Text Align</label>
            <select
              value={element.textAlign || 'left'}
              onChange={(e) => onUpdate(element.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      )}

      {/* Barcode-specific properties */}
      {element.type === 'barcode' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Barcode Font</label>
            <select
              value={element.fontFamily || '3OF9'}
              onChange={(e) => onUpdate(element.id, { fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={fontsLoading}
            >
              {fontsLoading ? (
                <option>Loading fonts...</option>
              ) : (
                <>
                  <option value="FREE3OF9">FREE3OF9 (Code 39)</option>
                  <option value="3OF9">3OF9 (Code 39)</option>
                  <option value="FRE3OF9X">FRE3OF9X (Extended)</option>
                  <option value="EanBwr">EAN Barcode</option>
                  <option value="LibreBarcode39">Libre Barcode 39</option>
                  {barcodeFonts.map((font) => (
                    <option key={font.family} value={font.family}>
                      {font.displayName}
                    </option>
                  ))}
                </>
              )}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {fontsLoading ? 'Detecting fonts...' : `${5 + barcodeFonts.length} barcode font(s) available`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Size (pt)</label>
            <BufferedInput
              value={element.fontSize || 48}
              onCommit={(val) => onUpdate(element.id, { fontSize: val })}
              min={12}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none"
            />
          </div>
        </div>
      )}

      {/* LINE PROPERTIES */}
      {element.type === 'line' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Line Properties</h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Line Thickness */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Thickness (px)</label>
              <BufferedInput
                value={element.lineThickness || 1}
                onCommit={(val) => onUpdate(element.id, { lineThickness: Math.max(1, Math.min(5, val)) })}
                min={1}
                max={5}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Line Style */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Line Style</label>
              <select
                value={element.lineStyle || 'solid'}
                onChange={(e) => onUpdate(element.id, { lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>

          {/* Line Color */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Line Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={element.lineColor || '#000000'}
                onChange={(e) => onUpdate(element.id, { lineColor: e.target.value })}
                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.lineColor || '#000000'}
                onChange={(e) => onUpdate(element.id, { lineColor: e.target.value })}
                placeholder="#000000"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* LABEL/VALUE PAIR PROPERTIES */}
      {element.type === 'label-value' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Label/Value Properties</h4>

          {/* Label Text */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Label Text</label>
            <input
              type="text"
              value={element.labelText || 'Label'}
              onChange={(e) => onUpdate(element.id, { labelText: e.target.value })}
              placeholder="e.g., Date, CIPL NO"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Separator */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Separator</label>
              <input
                type="text"
                value={element.separator || ':'}
                onChange={(e) => onUpdate(element.id, { separator: e.target.value })}
                placeholder=":"
                maxLength={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
              />
            </div>

            {/* Layout */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Layout</label>
              <select
                value={element.layout || 'horizontal'}
                onChange={(e) => onUpdate(element.id, { layout: e.target.value as 'horizontal' | 'vertical' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </div>

          {/* Label Bold Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`labelBold-${element.id}`}
              checked={element.labelBold !== false}
              onChange={(e) => onUpdate(element.id, { labelBold: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor={`labelBold-${element.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
              Bold Label Text
            </label>
          </div>
        </div>
      )}

      {/* RECTANGLE PROPERTIES */}
      {element.type === 'rectangle' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Rectangle Properties</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Border Width (px)</label>
              <BufferedInput
                value={element.borderWidth ?? 2}
                onCommit={(val) => onUpdate(element.id, { borderWidth: Math.max(0, Math.min(5, val)) })}
                min={0}
                max={5}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Border Style</label>
              <select
                value={element.borderStyle || 'solid'}
                onChange={(e) => onUpdate(element.id, { borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Border Color</label>
            <div className="flex gap-2">
              <input type="color" value={element.borderColor || '#000000'} onChange={(e) => onUpdate(element.id, { borderColor: e.target.value })} className="w-12 h-10 border border-slate-300 rounded cursor-pointer" />
              <input type="text" value={element.borderColor || '#000000'} onChange={(e) => onUpdate(element.id, { borderColor: e.target.value })} placeholder="#000000" className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={element.backgroundColor || '#FFFFFF'} onChange={(e) => onUpdate(element.id, { backgroundColor: e.target.value })} className="w-12 h-10 border border-slate-300 rounded cursor-pointer" />
              <input type="text" value={element.backgroundColor || 'transparent'} onChange={(e) => onUpdate(element.id, { backgroundColor: e.target.value })} placeholder="transparent" className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Corner Radius (px)</label>
            <BufferedInput
              value={element.cornerRadius || 0}
              onCommit={(val) => onUpdate(element.id, { cornerRadius: Math.max(0, Math.min(10, val)) })}
              min={0}
              max={10}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* TABLE PROPERTIES */}
      {element.type === 'table' && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Table Properties</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Rows</label>
              <BufferedInput
                value={element.rows || 4}
                onCommit={(val) => onUpdate(element.id, { rows: Math.max(1, Math.min(20, val)) })}
                min={1}
                max={20}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Columns</label>
              <BufferedInput
                value={element.columns || 4}
                onCommit={(val) => onUpdate(element.id, { columns: Math.max(1, Math.min(10, val)) })}
                min={1}
                max={10}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`showBorders-${element.id}`}
                checked={element.showBorders !== false}
                onChange={(e) => onUpdate(element.id, { showBorders: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor={`showBorders-${element.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                Show Cell Borders
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`autoNumber-${element.id}`}
                checked={element.autoNumber || false}
                onChange={(e) => onUpdate(element.id, { autoNumber: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor={`autoNumber-${element.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                Auto-Number Cells (1, 2, 3...)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`headerRow-${element.id}`}
                checked={element.headerRow || false}
                onChange={(e) => onUpdate(element.id, { headerRow: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor={`headerRow-${element.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                First Row as Header
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
