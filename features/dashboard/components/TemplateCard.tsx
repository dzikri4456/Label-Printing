import React from 'react';
import { SavedTemplate } from '../../../core/template-repository';
import { Calendar, Edit, Trash2, Printer, Download } from 'lucide-react';
import { useUser } from '../../users/UserContext';

interface TemplateCardProps {
  template: SavedTemplate;
  onClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (e: React.MouseEvent, template: SavedTemplate) => void;
  onExport: (e: React.MouseEvent, id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  onEdit,
  onDelete,
  onExport
}) => {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={() => onClick(template.id)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group flex flex-col overflow-hidden h-full"
    >
      {/* PREVIEW AREA */}
      <div className="h-40 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:bg-indigo-50/20 transition-colors">
        <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
          <div
            className="bg-white shadow-sm border border-slate-300"
            style={{ width: '100px', height: `${100 * (template.height / template.width)}px` }}
          ></div>
        </div>

        {/* DIMENSIONS BADGE (Fixed Positioning) */}
        <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-slate-500 border border-slate-200 pointer-events-none shadow-sm">
          {template.width}mm x {template.height}mm
        </div>

        {/* Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold text-indigo-600 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <Printer className="w-4 h-4" />
            Open Station
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1" title={template.name}>
            {template.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Calendar className="w-3 h-3" />
          Updated {formatDate(template.lastModified)}
        </div>

        <div className="mt-auto flex gap-2 pt-4 border-t border-slate-100">
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(template.id); }}
              className="flex-1 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onClick(template.id); }}
            className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={(e) => onExport(e, template.id)}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-green-50 hover:border-green-200 text-slate-400 hover:text-green-600 rounded-lg transition-colors z-20 flex items-center justify-center"
            title="Export Template"
          >
            <Download className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={(e) => onDelete(e, template)}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-lg transition-colors z-20 flex items-center justify-center"
              title="Delete Template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
