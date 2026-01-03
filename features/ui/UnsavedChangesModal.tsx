import React from 'react';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onResume: () => void;
  onDiscard: () => void;
  onSaveAndExit: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  isSaving,
  onResume,
  onDiscard,
  onSaveAndExit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-amber-500 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-4">
           <div className="bg-amber-100 p-3 rounded-full shrink-0">
             <AlertTriangle className="w-6 h-6 text-amber-600" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">Unsaved Changes</h3>
             <p className="text-sm text-slate-500 mt-1 leading-relaxed">
               You have unsaved changes in your template. Leaving now will cause these changes to be lost permanently.
             </p>
           </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {/* Option C: Save & Exit */}
          <button
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
               <>Processing...</>
            ) : (
               <>
                 <Save className="w-4 h-4" />
                 Save & Exit
               </>
            )}
          </button>

          <div className="flex gap-3">
             {/* Option A: Resume */}
             <button
               onClick={onResume}
               disabled={isSaving}
               className="flex-1 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
             >
               Resume Editing
             </button>

             {/* Option B: Discard */}
             <button
               onClick={onDiscard}
               disabled={isSaving}
               className="flex-1 py-2.5 border border-red-200 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
             >
               <Trash2 className="w-4 h-4" />
               Discard
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};