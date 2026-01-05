import React from 'react';
import Barcode from 'react-barcode';
import { mmToPx } from '../../../core/print-utils';
import { LabelElementData } from '../types';
import { Unplug } from 'lucide-react';
import { DEFAULTS } from '../../../core/constants';

interface LabelElementProps {
  data: LabelElementData;
  isSelected: boolean;
  isPreview: boolean;
  isBrokenLink?: boolean;
  displayValue: string; // Pre-calculated display value
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (e: React.MouseEvent, id: string) => void;
}

const LabelElementComponent: React.FC<LabelElementProps> = ({ 
  data, 
  isSelected, 
  isPreview,
  isBrokenLink,
  displayValue,
  onMouseDown,
  onResizeMouseDown,
  onDoubleClick
}) => {
  // Calculate dimensions
  const leftPx = mmToPx(data.x);
  const topPx = mmToPx(data.y);
  
  // Default dimensions from constants
  const defaultWidth = DEFAULTS.ELEMENT.WIDTH;
  const defaultHeight = data.type === 'barcode' ? DEFAULTS.ELEMENT.HEIGHT_BARCODE : DEFAULTS.ELEMENT.HEIGHT_TEXT;

  const widthPx = data.width ? mmToPx(data.width) : mmToPx(defaultWidth);
  const heightPx = data.height ? mmToPx(data.height) : mmToPx(defaultHeight);
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${leftPx}px`,
    top: `${topPx}px`,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    textAlign: data.textAlign || 'left',
    lineHeight: 1.2,
    zIndex: isSelected ? 10 : 1,
    cursor: isPreview ? 'default' : 'grab',
    
    // BOUNDING BOX DOCTRINE:
    // Content must be strictly clipped to the box. 
    // Words break if they are too long.
    overflow: 'hidden',
    wordWrap: 'break-word',
    // whiteSpace: 'pre-wrap', // Allows wrapping
    display: 'flex',
    flexDirection: 'column',
    // For text, we usually align top, but flex allows control if needed later
    justifyContent: 'flex-start', 
  };

  // Determine Visual Style
  let containerClass = "transition-all ";
  if (!isPreview) {
    if (isSelected) {
      containerClass += "outline outline-2 outline-indigo-500 border-indigo-500 shadow-lg bg-indigo-50/10 ";
    } else if (isBrokenLink) {
      // Visual Warning for Broken Links
      containerClass += "outline outline-2 outline-red-400 outline-dashed bg-red-50/50 ";
    } else if (data.isDynamic) {
      containerClass += "hover:outline hover:outline-1 hover:outline-purple-300 border border-purple-200 border-dashed bg-purple-50/30 ";
    } else {
      containerClass += "hover:outline hover:outline-1 hover:outline-indigo-300 ";
    }
  }

  // Visual Aliasing Logic (Design Mode Only)
  const showAlias = !isPreview && data.isDynamic && data.schemaLabel;

  const content = () => {
    // If link is broken, show icon instead of alias
    if (!isPreview && isBrokenLink) {
      return (
         <div className="w-full h-full flex items-center justify-center text-red-500 gap-1" title={`Broken Link: {{${data.bindingKey}}}`}>
            <Unplug className="w-4 h-4" />
            <span className="text-[10px] font-bold">UNLINKED</span>
         </div>
      );
    }

    if (data.type === 'barcode') {
      // For barcode, we fit it inside the height
      return (
        <div className="pointer-events-none w-full h-full flex items-center justify-center"> 
          <Barcode 
            value={displayValue} 
            width={2} 
            height={heightPx - 10} // Padding subtraction
            format="CODE128"
            displayValue={true}
            font="monospace"
            textAlign="center"
            textMargin={2}
            fontSize={12}
            margin={0}
            renderer="svg" 
            background="transparent"
          />
        </div>
      );
    }

    if (showAlias) {
      return (
        <div className="w-full h-full text-purple-800 px-1 text-xs font-semibold flex items-center justify-center select-none">
          [{data.schemaLabel}]
        </div>
      );
    }

    return (
      <div 
        style={{
          fontSize: `${data.fontSize || DEFAULTS.ELEMENT.FONT_SIZE}pt`, 
          fontFamily: data.fontFamily || 'Arial, sans-serif',
          fontWeight: data.fontWeight || 'normal',
        }}
        className={`pointer-events-none w-full ${(!isPreview && data.isDynamic) ? 'text-purple-700' : 'text-black'}`}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div 
      style={style} 
      className={containerClass}
      onMouseDown={(e) => onMouseDown(e, data.id)}
      onDoubleClick={(e) => onDoubleClick(e, data.id)}
    >
      {content()}

      {/* Resize Handle (Only in Design Mode & Selected) */}
      {!isPreview && isSelected && (
        <div 
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-se-resize z-20 shadow-sm hover:scale-125 transition-transform"
          onMouseDown={(e) => onResizeMouseDown(e, data.id)}
        />
      )}
    </div>
  );
};

/**
 * MEMOIZATION STRATEGY:
 * Only re-render if visual properties, selection state, or data value changes.
 * Function references (onMouseDown) are assumed stable due to parent logic.
 */
export const LabelElement = React.memo(LabelElementComponent, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.isPreview === next.isPreview &&
    prev.isBrokenLink === next.isBrokenLink &&
    prev.displayValue === next.displayValue &&
    prev.data === next.data // Strict object reference equality (relies on immutable updates in hook)
  );
});