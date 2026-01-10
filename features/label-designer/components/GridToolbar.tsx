import React from 'react';
import { Grid3x3, Magnet, Ruler } from 'lucide-react';

interface GridToolbarProps {
    gridEnabled: boolean;
    snapEnabled: boolean;
    rulersEnabled: boolean;
    gridSize: number;
    onToggleGrid: () => void;
    onToggleSnap: () => void;
    onToggleRulers: () => void;
    onGridSizeChange: (size: number) => void;
    onClose?: () => void;
    className?: string;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({
    gridEnabled,
    snapEnabled,
    rulersEnabled,
    gridSize,
    onToggleGrid,
    onToggleSnap,
    onToggleRulers,
    onGridSizeChange,
    onClose,
    className = '',
}) => {
    const gridSizes = [1, 2, 5, 10, 20];

    return (
        <div className={`flex items-center gap-2 bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 ${className}`}>
            {/* Grid Toggle */}
            <button
                onClick={onToggleGrid}
                className={`p-2 rounded transition-colors ${gridEnabled
                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                    : 'text-slate-400 hover:bg-slate-100'
                    }`}
                title="Toggle Grid Background (G)"
            >
                <Grid3x3 className="w-4 h-4" />
            </button>

            {/* Snap Toggle */}
            <button
                onClick={onToggleSnap}
                className={`p-2 rounded transition-colors ${snapEnabled
                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                    : 'text-slate-400 hover:bg-slate-100'
                    }`}
                title="Toggle Snap to Grid (S) - Works independently from grid visibility"
            >
                <Magnet className="w-4 h-4" />
            </button>

            {/* Rulers Toggle */}
            <button
                onClick={onToggleRulers}
                className={`p-2 rounded transition-colors ${rulersEnabled
                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                    : 'text-slate-400 hover:bg-slate-100'
                    }`}
                title="Toggle Rulers (R)"
            >
                <Ruler className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Grid Size Selector */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Grid:</span>
                <select
                    value={gridSize}
                    onChange={(e) => onGridSizeChange(Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {gridSizes.map((size) => (
                        <option key={size} value={size}>
                            {size}mm
                        </option>
                    ))}
                </select>
            </div>

            {/* Info Text */}
            <div className="ml-2 pl-2 border-l border-slate-200">
                <div className="text-[10px] text-slate-400">
                    <div className="font-medium">Grid: Visual guide</div>
                    <div>Snap: {snapEnabled ? 'ON' : 'OFF'} ({gridSize}mm)</div>
                </div>
            </div>
            
            {/* Close Button */}
            {onClose && (
                <>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={onClose}
                        className="p-2 rounded transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Hide Grid Controls (Esc)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
};

