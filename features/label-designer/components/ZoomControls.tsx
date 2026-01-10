import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitToView: () => void;
    onZoomChange: (zoom: number) => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onFitToView,
    onZoomChange,
    canZoomIn,
    canZoomOut,
    className = '',
}) => {
    const zoomPercentage = Math.round(zoom * 100);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        onZoomChange(newZoom);
    };

    return (
        <div className={`flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-3 py-2 ${className}`}>
            {/* Zoom Out Button */}
            <button
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out (Ctrl + -)"
            >
                <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>

            {/* Zoom Slider */}
            <input
                type="range"
                min="0.25"
                max="2"
                step="0.05"
                value={zoom}
                onChange={handleSliderChange}
                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                title={`Zoom: ${zoomPercentage}%`}
            />

            {/* Zoom In Button */}
            <button
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom In (Ctrl + +)"
            >
                <ZoomIn className="w-4 h-4 text-slate-600" />
            </button>

            {/* Zoom Percentage Display */}
            <div className="min-w-[3.5rem] text-center">
                <span className="text-xs font-bold text-slate-700">
                    {zoomPercentage}%
                </span>
            </div>

            {/* Fit to View Button */}
            <button
                onClick={onFitToView}
                className="p-1.5 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-l border-slate-200 ml-1 pl-2"
                title="Fit to View (Ctrl + 0)"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
        </div>
    );
};


