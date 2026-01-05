import React, { useRef } from 'react';
import { mmToPx } from '../../../core/print-utils';
import { LabelTemplate, LabelElementData } from '../types';
import { LabelElement } from './LabelElement';
import { useSchema } from '../context/SchemaContext';

interface LabelCanvasProps {
  template: LabelTemplate;
  selectedId: string | null;
  isPreviewMode: boolean;
  onCanvasClick: () => void;
  onElementMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string) => void;
  onElementDoubleClick: (e: React.MouseEvent, id: string) => void; // New Prop
  onDropFromSidebar: (e: React.DragEvent, canvasRect: DOMRect) => void;
  getElementDisplayValue: (element: LabelElementData) => string; 
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
  getElementDisplayValue
}) => {
  const widthPx = mmToPx(template.width);
  const heightPx = mmToPx(template.height);
  const canvasRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div 
      className={`flex items-center justify-center bg-slate-200/50 p-12 min-h-full overflow-auto ${isPreviewMode ? 'cursor-not-allowed' : 'cursor-default'}`}
      onClick={onCanvasClick}
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
        {template.elements.map((element) => {
          // Check if this element's binding key still exists in the schema
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
      
      <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono no-print">
        {isPreviewMode ? 'PREVIEW MODE' : `${template.width}mm x ${template.height}mm`}
      </div>
    </div>
  );
};

export const LabelCanvas = React.memo(LabelCanvasComponent);