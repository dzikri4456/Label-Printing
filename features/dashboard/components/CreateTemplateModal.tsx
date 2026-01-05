import React, { useState } from 'react';
import { Plus, X, FileText, Tag, Maximize2 } from 'lucide-react';
import { DEFAULTS, PAPER_SIZES, getPaperSizesByCategory, type PaperSize } from '../../../core/constants';
import { Logger } from '../../../core/logger';
import { SavedTemplate, templateRepository } from '../../../core/template-repository';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../../ui/ToastContext';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (id: string) => void;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess
}) => {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [widthStr, setWidthStr] = useState(String(DEFAULTS.TEMPLATE.WIDTH));
  const [heightStr, setHeightStr] = useState(String(DEFAULTS.TEMPLATE.HEIGHT));
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'standard' | 'label'>('label');

  if (!isOpen) return null;

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    let clean = val.replace(/[^0-9.]/g, '');
    if ((clean.match(/\./g) || []).length > 1) return;
    setter(clean);
  };

  const handlePresetSelect = (preset: PaperSize) => {
    setSelectedPreset(preset.name);
    setWidthStr(String(preset.width));
    setHeightStr(String(preset.height));
    if (!name.trim()) {
      setName(preset.name);
    }
  };

  const handleSubmit = () => {
    const finalName = name.trim();
    if (!finalName) return;

    // Strict Parse with Safe Defaults
    const width = Math.max(10, parseFloat(widthStr) || DEFAULTS.TEMPLATE.WIDTH);
    const height = Math.max(10, parseFloat(heightStr) || DEFAULTS.TEMPLATE.HEIGHT);

    try {
      const newId = uuidv4();
      const newTemplate: SavedTemplate = {
        id: newId,
        name: finalName,
        width: width,
        height: height,
        elements: [],
        schema: [],
        lastModified: Date.now()
      };

      templateRepository.save(newTemplate);
      Logger.info('Create Template', { id: newId, name: finalName });

      onCreateSuccess(newId);

      // Reset Form
      setName('');
      setWidthStr(String(DEFAULTS.TEMPLATE.WIDTH));
      setHeightStr(String(DEFAULTS.TEMPLATE.HEIGHT));
      setSelectedPreset(null);

    } catch (err) {
      Logger.error('Create Template Failed', err);
      addToast("Failed to create template", "error");
    }
  };

  const standardSizes = getPaperSizesByCategory('standard');
  const labelSizes = getPaperSizesByCategory('label');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-600" />
              Create New Template
            </h2>
            <p className="text-sm text-slate-500 mt-1">Choose a preset or enter custom dimensions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400 hover:text-red-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Template Name */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Template Name
            </label>
            <input
              type="text"
              value={name}
              maxLength={DEFAULTS.UI.MAX_NAME_LENGTH}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Shipping Label 100x50mm"
              autoFocus
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">Max {DEFAULTS.UI.MAX_NAME_LENGTH} characters</span>
              <span className={`text-xs font-mono ${name.length === DEFAULTS.UI.MAX_NAME_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {name.length}/{DEFAULTS.UI.MAX_NAME_LENGTH}
              </span>
            </div>
          </div>

          {/* Paper Size Presets */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-600" />
              Paper Size Presets
            </label>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveCategory('label')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeCategory === 'label'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Tag className="w-4 h-4 inline mr-2" />
                Label Sizes
              </button>
              <button
                onClick={() => setActiveCategory('standard')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeCategory === 'standard'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Standard Paper
              </button>
            </div>

            {/* Preset Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {(activeCategory === 'label' ? labelSizes : standardSizes).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${selectedPreset === preset.name
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                    }`}
                >
                  <div className="font-bold text-slate-800 text-sm mb-1">{preset.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Custom Dimensions (mm)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Width</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={widthStr}
                  onChange={e => {
                    handleNumericChange(setWidthStr, e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-lg"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Height</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={heightStr}
                  onChange={e => {
                    handleNumericChange(setHeightStr, e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-lg"
                  placeholder="50"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <strong>Preview:</strong> {widthStr || '0'} × {heightStr || '0'} mm
              {parseFloat(widthStr) > 0 && parseFloat(heightStr) > 0 && (
                <span className="ml-2">
                  ({(parseFloat(widthStr) / 25.4).toFixed(2)}" × {(parseFloat(heightStr) / 25.4).toFixed(2)}")
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !widthStr || !heightStr}
            className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>

      </div>
    </div>
  );
};