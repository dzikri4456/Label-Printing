import React, { useState } from 'react';
import { LabelTemplate, LabelElementData } from '../types';
import { Settings, Database } from 'lucide-react';
import { SchemaManagerModal } from './SchemaManagerModal';
import { PropertyEditor } from './panels/PropertyEditor';
import { CanvasSettings } from './panels/CanvasSettings';
import { DataObjectsPanel } from './panels/DataObjectsPanel';

interface EditorPanelProps {
  template: LabelTemplate;
  selectedId: string | null;
  onUpdateTemplate: (updates: Partial<LabelTemplate>) => void;
  onUpdateElement: (id: string, updates: Partial<LabelElementData>) => void;
  onDeleteElement: (id: string) => void; 
  onPrint: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  template, 
  selectedId, 
  onUpdateTemplate, 
  onUpdateElement, 
  onDeleteElement, 
  onPrint 
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'data'>('design');
  const [showSchemaManager, setShowSchemaManager] = useState(false);
  
  const selectedElement = template.elements.find(el => el.id === selectedId);

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10 relative">
      
      {/* GLOBAL HEADER */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="flex">
          <button 
            onClick={() => { setActiveTab('design'); }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'design' && !selectedElement ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
          >
            <Settings className="w-4 h-4" />
            Designer
          </button>
          <button 
             onClick={() => { setActiveTab('data'); }}
             className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'data' && !selectedElement ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
          >
            <Database className="w-4 h-4" />
            Data Objects
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* CASE 1: ELEMENT SELECTED (Override Tabs) */}
        {selectedElement ? (
            <PropertyEditor 
              element={selectedElement}
              onUpdate={onUpdateElement}
              onDelete={onDeleteElement}
            />
        ) : (
            <>
                {/* CASE 2: TAB DESIGN */}
                {activeTab === 'design' && (
                    <CanvasSettings 
                      template={template}
                      onUpdate={onUpdateTemplate}
                    />
                )}

                {/* CASE 3: TAB DATA */}
                {activeTab === 'data' && (
                    <DataObjectsPanel 
                      onManageFields={() => setShowSchemaManager(true)}
                    />
                )}
            </>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 bg-white">
        <button
          onClick={onPrint}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          Print Label
        </button>
      </div>

      <SchemaManagerModal 
        isOpen={showSchemaManager} 
        onClose={() => setShowSchemaManager(false)} 
      />
    </div>
  );
};