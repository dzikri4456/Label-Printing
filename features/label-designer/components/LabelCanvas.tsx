import React, { useRef, useEffect, useState } from 'react';
import { mmToPx } from '../../../core/print-utils';
import { LabelTemplate, LabelElementData } from '../types';
import { LabelElement } from './LabelElement';
import { useSchema } from '../context/SchemaContext';
import { ZoomControls } from './ZoomControls';
import { GridOverlay } from './GridOverlay';
import { Rulers } from './Rulers';
import { GridToolbar } from './GridToolbar';
import { useCanvasZoom } from '../../../hooks/useCanvasZoom';

interface LabelCanvasProps {
  template: LabelTemplate;
  selectedId: string | null;
  isPreviewMode: boolean;
  onCanvasClick: () => void;
  onElementMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string) => void;
  onElementDoubleClick: (e: React.MouseEvent, id: string) => void;
  onDropFromSidebar: (e: React.DragEvent, canvasRect: DOMRect) => void;
  getElementDisplayValue: (element: LabelElementData) => string;
  // Grid and ruler controls
  gridEnabled?: boolean;
  gridSize?: number;
  snapEnabled?: boolean;
  rulersEnabled?: boolean;
  gridToolbarVisible?: boolean;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onToggleRulers?: () => void;
  onToggleGridToolbar?: () => void;
  onGridSizeChange?: (size: number) => void;
}

const LabelCanvasComponent: React.FC<LabelCanvasProps> = ({
  template,
  selectedId,
  isPreviewMode,
  onCanvasClick,
  onElementMouseDown,
  onResizeMouseDown,
  onElementDoubleClick,
  onDropFromSidebar,
  getElementDisplayValue,
  gridEnabled = true,
  gridSize = 5,
  snapEnabled = false,
  rulersEnabled = true,
  gridToolbarVisible = true,
  onToggleGrid = () => { },
  onToggleSnap = () => { },
  onToggleRulers = () => { },
  onToggleGridToolbar = () => { },
  onGridSizeChange = () => { },
}) => {
  const widthPx = mmToPx(template.width);
  const heightPx = mmToPx(template.height);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track viewport dimensions
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  // Zoom controls
  const {
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    fitToView,
    canZoomIn,
    canZoomOut,
  } = useCanvasZoom(widthPx, heightPx, viewportSize.width, viewportSize.height);

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateViewportSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);

    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          fitToView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitToView]);

  // Validation Logic
  const { fields } = useSchema();
  const validSchemaKeys = new Set(fields.map(f => f.key));

  const handleDragOver = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isPreviewMode) return;
    e.preventDefault();
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      onDropFromSidebar(e, rect);
    }
  };

  const gridSizePx = mmToPx(gridSize);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center bg-slate-200/50 min-h-full overflow-auto ${isPreviewMode ? 'cursor-not-allowed' : 'cursor-default'}`}
      onClick={onCanvasClick}
    >
      {/* Rulers */}
      {rulersEnabled && !isPreviewMode && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <Rulers
            canvasWidth={widthPx}
            canvasHeight={heightPx}
            zoom={zoom}
            pxPerMm={3.779527559055118}
          />
        </div>
      )}

      {/* Canvas with zoom transform */}
      <div
        className="p-12"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        <div
          ref={canvasRef}
          id="label-print-area"
          className="bg-white shadow-2xl relative overflow-hidden"
          style={{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            outline: '1px solid #e2e8f0',
          }}
          onClick={(e) => e.stopPropagation()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Grid Overlay */}
          {gridEnabled && !isPreviewMode && (
            <GridOverlay
              width={widthPx}
              height={heightPx}
              gridSize={gridSizePx}
              visible={true}
            />
          )}

          {/* Elements */}
          {template.elements.map((element) => {
            const isBrokenLink = element.isDynamic && element.bindingKey && !validSchemaKeys.has(element.bindingKey);

            return (
              <LabelElement
                key={element.id}
                data={element}
                isSelected={element.id === selectedId}
                isPreview={isPreviewMode}
                isBrokenLink={!!isBrokenLink}
                displayValue={getElementDisplayValue(element)}
                onMouseDown={onElementMouseDown}
                onResizeMouseDown={onResizeMouseDown}
                onDoubleClick={onElementDoubleClick}
              />
            );
          })}
        </div>
      </div>

      {/* Dimension indicator */}
      <div className="absolute bottom-4 left-4 text-[11px] text-slate-400 font-mono no-print bg-white/80 backdrop-blur px-2 py-1 rounded">
        {isPreviewMode ? 'PREVIEW MODE' : `${template.width}mm × ${template.height}mm`}
      </div>

      {/* Grid Toolbar Toggle Button */}
      {!isPreviewMode && (
        <div className="absolute top-4 left-4 no-print">
          {!gridToolbarVisible ? (
            <button
              onClick={onToggleGridToolbar}
              className="p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Show Grid Controls (G)"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : (
            <GridToolbar
              gridEnabled={gridEnabled}
              snapEnabled={snapEnabled}
              rulersEnabled={rulersEnabled}
              gridSize={gridSize}
              onToggleGrid={onToggleGrid}
              onToggleSnap={onToggleSnap}
              onToggleRulers={onToggleRulers}
              onGridSizeChange={onGridSizeChange}
              onClose={onToggleGridToolbar}
            />
          )}
        </div>
      )}

      {/* Zoom Controls - Bottom Left Inside Canvas */}
      <div className="absolute bottom-6 left-6 no-print z-40">
        <ZoomControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToView={fitToView}
          onZoomChange={setZoom}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
        />
      </div>
    </div>
  );
};

export const LabelCanvas = React.memo(LabelCanvasComponent);


