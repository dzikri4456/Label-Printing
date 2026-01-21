import React, { useRef, useEffect, useCallback } from 'react';
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
  // Refs for auto-fit content
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit content within container
  const calculateScale = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return 1;

    const content = contentRef.current;
    const container = containerRef.current;

    // Get actual content dimensions
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;

    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Skip if no content or container
    if (contentWidth === 0 || contentHeight === 0 || containerWidth === 0 || containerHeight === 0) {
      return 1;
    }

    // Calculate scale factors
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;

    // Use the smaller scale to ensure content fits in both dimensions
    // Never scale up (max 1), only scale down
    const scale = Math.min(scaleX, scaleY, 1);

    return scale;
  }, []);

  // Apply auto-fit scaling when content or dimensions change
  useEffect(() => {
    if (!contentRef.current) return;

    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      const scale = calculateScale();

      if (contentRef.current) {
        contentRef.current.style.transform = `scale(${scale})`;
        contentRef.current.style.transformOrigin = 'top left';
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [displayValue, data.fontSize, data.width, data.height, data.fontFamily, data.fontWeight, calculateScale]);
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
    lineHeight: 1.2,
    zIndex: isSelected ? 10 : 1,
    cursor: isPreview ? 'default' : 'grab',

    // BOUNDING BOX DOCTRINE:
    // Content must be strictly clipped to the box. 
    // Words break if they are too long.
    overflow: 'hidden',
    wordWrap: 'break-word',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: data.textAlign === 'center' ? 'center' :
      data.textAlign === 'right' ? 'flex-end' : 'flex-start',
    alignItems: data.textAlign === 'center' ? 'center' :
      data.textAlign === 'right' ? 'flex-end' : 'flex-start',
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

    // LINE ELEMENT RENDERING
    if (data.type === 'line') {
      const lineThickness = data.lineThickness || 1;
      const lineStyle = data.lineStyle || 'solid';
      const lineColor = data.lineColor || '#000000';

      return (
        <div
          className="w-full h-full flex items-center"
          style={{
            borderTop: `${lineThickness}px ${lineStyle} ${lineColor}`,
          }}
        />
      );
    }

    // LABEL/VALUE PAIR RENDERING
    if (data.type === 'label-value') {
      const labelText = data.labelText || 'Label';
      const separator = data.separator || ':';
      const labelBold = data.labelBold !== false; // Default true
      const layout = data.layout || 'horizontal';

      return (
        <div
          className={`w-full h-full flex ${layout === 'vertical' ? 'flex-col' : 'flex-row items-center'} gap-1`}
          style={{
            fontSize: `${data.fontSize || 12}px`,
            fontFamily: data.fontFamily || 'Arial',
          }}
        >
          <span style={{ fontWeight: labelBold ? 'bold' : 'normal' }}>
            {labelText}{separator}
          </span>
          <span style={{ fontWeight: data.fontWeight || 'normal' }}>
            {displayValue}
          </span>
        </div>
      );
    }

    // RECTANGLE ELEMENT RENDERING
    if (data.type === 'rectangle') {
      const borderWidth = data.borderWidth ?? 2;
      const borderColor = data.borderColor || '#000000';
      const borderStyle = data.borderStyle || 'solid';
      const backgroundColor = data.backgroundColor || 'transparent';
      const cornerRadius = data.cornerRadius || 0;

      return (
        <div
          className="w-full h-full"
          style={{
            border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
            backgroundColor: backgroundColor,
            borderRadius: `${cornerRadius}px`,
          }}
        />
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
            format={data.barcodeFormat || 'CODE39'}
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
        <div
          className="w-full h-full text-purple-800 px-1 text-xs font-semibold flex items-center justify-center select-none"
          style={{
            fontFamily: data.fontFamily || 'Arial',
            fontSize: `${data.fontSize || 12}px`
          }}
        >
          [{data.schemaLabel}]
        </div>
      );
    }

    return (
      <div
        ref={contentRef}
        style={{
          fontSize: `${data.fontSize || DEFAULTS.ELEMENT.FONT_SIZE}pt`,
          fontFamily: data.fontFamily || 'Arial',
          fontWeight: data.fontWeight || 'normal',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          textAlign: data.textAlign || 'left',
        }}
        className={`pointer-events-none ${(!isPreview && data.isDynamic) ? 'text-purple-700' : 'text-black'}`}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
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

