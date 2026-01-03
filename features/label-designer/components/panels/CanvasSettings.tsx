import React from 'react';
import { Ruler } from 'lucide-react';
import { LabelTemplate } from '../../types';
import { BufferedInput } from '../BufferedInput';

interface CanvasSettingsProps {
  template: LabelTemplate;
  onUpdate: (updates: Partial<LabelTemplate>) => void;
}

export const CanvasSettings: React.FC<CanvasSettingsProps> = ({ template, onUpdate }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Ruler className="w-3 h-3" />
          <span>Canvas Dimensions</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Width (mm)</label>
            <BufferedInput
              value={template.width}
              onCommit={(val) => onUpdate({ width: val })}
              min={20}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Height (mm)</label>
            <BufferedInput
              value={template.height}
              onCommit={(val) => onUpdate({ height: val })}
              min={20}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};