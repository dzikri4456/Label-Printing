import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DEFAULTS } from '../../../core/constants';
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

  if (!isOpen) return null;

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    let clean = val.replace(/[^0-9.]/g, '');
    if ((clean.match(/\./g) || []).length > 1) return;
    setter(clean);
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
      
    } catch (err) {
      Logger.error('Create Template Failed', err);
      addToast("Failed to create template", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Create New Template</h2>
            <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Template Name</label>
              <input 
                  type="text" 
                  value={name}
                  maxLength={DEFAULTS.UI.MAX_NAME_LENGTH}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Shipping Label A5"
                  autoFocus
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">Max {DEFAULTS.UI.MAX_NAME_LENGTH} characters</span>
                <span className={`text-[10px] font-mono ${name.length === DEFAULTS.UI.MAX_NAME_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {name.length}/{DEFAULTS.UI.MAX_NAME_LENGTH}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Width (mm)</label>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={widthStr}
                    onChange={e => handleNumericChange(setWidthStr, e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Height (mm)</label>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={heightStr}
                    onChange={e => handleNumericChange(setHeightStr, e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Template
            </button>
        </div>
      </div>
    </div>
  );
};