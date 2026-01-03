import React, { useState, useEffect } from 'react';
import { useSchema } from '../context/SchemaContext';
import { DataFieldDef } from '../../../core/schema-registry';
import { X, Database, Plus, Edit2, Trash2, Save, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useToast } from '../../ui/ToastContext';

interface SchemaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaManagerModal: React.FC<SchemaManagerModalProps> = ({ isOpen, onClose }) => {
  const { fields, addField, updateField, deleteField } = useSchema();
  const { addToast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingField, setEditingField] = useState<Partial<DataFieldDef>>({});
  const [isNew, setIsNew] = useState(false);
  
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (field: DataFieldDef) => {
    setEditingField({ ...field });
    setIsNew(false);
    setKeyManuallyEdited(true); 
    setView('form');
  };

  const handleCreate = () => {
    setEditingField({ label: '', key: '', type: 'text' });
    setIsNew(true);
    setKeyManuallyEdited(false);
    setView('form');
  };

  const handleLabelChange = (val: string) => {
    setEditingField(prev => ({ ...prev, label: val }));
    
    if (!keyManuallyEdited && isNew) {
       const autoKey = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
       setEditingField(prev => ({ ...prev, key: autoKey }));
    }
  };

  const handleKeyChange = (val: string) => {
    setKeyManuallyEdited(true);
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setEditingField(prev => ({ ...prev, key: sanitized }));
  };

  const handleSave = () => {
    if (!editingField.label || !editingField.key) return;

    if (isNew) {
      addField({
        id: `custom_${Date.now()}`,
        label: editingField.label,
        key: editingField.key, 
        type: 'text',
        isCustom: true
      });
      addToast("Custom field added successfully", "success");
    } else if (editingField.id) {
      updateField(editingField.id, {
        label: editingField.label,
        key: editingField.key
      });
      addToast("Field updated", "success");
    }
    setView('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this field from the registry?')) {
      deleteField(id);
      addToast("Field removed", "info");
    }
  };

  const isCore = (id?: string) => id?.startsWith('f_');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
               <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Schema Manager</h2>
              <p className="text-xs text-slate-500">Define the data objects available for your label.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-0">
          
          {view === 'list' ? (
            <div className="p-6">
              <button 
                onClick={handleCreate}
                className="w-full mb-6 py-3 border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Field
              </button>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b">Label (Display Name)</th>
                      <th className="px-4 py-3 border-b">Binding Key (Variable)</th>
                      <th className="px-4 py-3 border-b text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50 group">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {field.label}
                          {isCore(field.id) && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">CORE</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {`{{${field.key}}}`}
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(field)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCore(field.id) && (
                            <button 
                              onClick={() => handleDelete(field.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 animate-in slide-in-from-right-8 duration-200">
              <div className="mb-6 flex items-center gap-2">
                <button onClick={() => setView('list')} className="p-1 hover:bg-slate-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h3 className="text-lg font-bold text-slate-800">{isNew ? 'Create New Field' : 'Edit Field'}</h3>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Display Label</label>
                  <p className="text-xs text-slate-400 mb-2">The friendly name shown in the sidebar list.</p>
                  <input 
                    type="text" 
                    value={editingField.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Driver Name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Binding Key</label>
                  <p className="text-xs text-slate-400 mb-2">The variable name mapped to Excel headers. Lowercase & underscores only.</p>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={editingField.key}
                      disabled={isCore(editingField.id) && !isNew}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      className={`w-full px-4 py-2 border border-slate-300 rounded-lg outline-none font-mono text-sm ${isCore(editingField.id) && !isNew ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                      placeholder="driver_name"
                    />
                    {editingField.key && (
                       <div className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                         {`{{${editingField.key}}}`}
                       </div>
                    )}
                  </div>
                  
                  {isCore(editingField.id) && !isNew ? (
                    <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>This is a Core System Field. You cannot change the binding key, only the Display Label.</span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Ensure this key matches your Excel column header exactly (after sanitization).</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setView('list')}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={!editingField.label || !editingField.key}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};