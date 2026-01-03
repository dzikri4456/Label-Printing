import React from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

export const DataNavigation: React.FC = () => {
  const { masterData, selectedIndex, setSelectedIndex } = useData();

  if (masterData.length === 0) return null;

  const handlePrev = () => {
    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex < masterData.length - 1) setSelectedIndex(selectedIndex + 1);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 no-print animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-full shadow-lg p-1.5 flex items-center gap-3 pr-4">
        
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Database className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-1">
            <button 
                onClick={handlePrev}
                disabled={selectedIndex === 0}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous Record"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="font-mono text-xs font-bold text-slate-700 w-24 text-center select-none">
                Record {selectedIndex + 1} / {masterData.length}
            </span>

            <button 
                onClick={handleNext}
                disabled={selectedIndex === masterData.length - 1}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next Record"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};