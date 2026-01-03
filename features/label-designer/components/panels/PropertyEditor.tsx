import React from 'react';
import { Type, Barcode as BarcodeIcon, Trash2, Database, Lock } from 'lucide-react';
import { LabelElementData, ValueFormat } from '../../types';
import { BufferedInput } from '../BufferedInput';

interface PropertyEditorProps {
  element: LabelElementData;
  onUpdate: (id: string, updates: Partial<LabelElementData>) => void;
  onDelete: (id: string) => void;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ element, onUpdate, onDelete }) => {
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
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Weight</label>
                <select
                  value={element.fontWeight}
                  onChange={(e) => onUpdate(element.id, { fontWeight: e.target.value as 'normal'|'bold' })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none"
                >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                </select>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};