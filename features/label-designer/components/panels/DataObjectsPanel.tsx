import React from 'react';
import { Cog, Database, User } from 'lucide-react';
import { useSchema } from '../../context/SchemaContext';
import { DataFieldDef } from '../../../../core/schema-registry';

interface DataObjectsPanelProps {
  onManageFields: () => void;
}

export const DataObjectsPanel: React.FC<DataObjectsPanelProps> = ({ onManageFields }) => {
  const { fields } = useSchema();

  const handleDragStart = (e: React.DragEvent, field: DataFieldDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify(field));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      <button 
        onClick={onManageFields}
        className="w-full py-2 border border-slate-300 bg-white rounded-lg text-slate-600 font-semibold text-xs hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
      >
        <Cog className="w-4 h-4" />
        Manage Fields
      </button>
      
      <div className="grid grid-cols-1 gap-2">
        {fields.map(field => {
          const isSystem = field.isSystem;
          return (
            <div 
              key={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              className={`p-3 bg-white border rounded shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all flex items-center gap-3 ${isSystem ? 'border-blue-200 hover:border-blue-400 bg-blue-50/20' : 'border-slate-200 hover:border-indigo-300'}`}
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${isSystem ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {isSystem ? <User className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </div>
              <div>
                <div className={`text-sm font-semibold ${isSystem ? 'text-blue-800' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                   {field.label}
                </div>
                <div className="text-[10px] text-slate-400 font-mono overflow-hidden text-ellipsis w-40">{`{{${field.key}}}`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};