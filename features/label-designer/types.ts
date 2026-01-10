export type ElementType = 'text' | 'barcode' | 'line' | 'label-value' | 'rectangle' | 'table';
export type ValueFormat = 'none' | 'currency_idr' | 'currency_usd' | 'date_short' | 'date_long' | 'barcode_39';

export interface LabelElementData {
  id: string;
  type: ElementType;
  x: number; // in mm
  y: number; // in mm
  value: string;

  // Dynamic Data Binding
  isDynamic?: boolean;
  bindingKey?: string; // The key from SAP Schema (e.g. 'material_number')
  schemaLabel?: string; // Human readable label (e.g. 'Material Number') for Visual Aliasing
  format?: ValueFormat; // Formatting option

  // Style properties
  fontSize?: number; // in pt for text, or specific unit for barcode
  width?: number; // in mm (optional constraint)
  height?: number; // in mm (mostly for barcode height)
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';

  // Line-specific properties
  lineThickness?: number; // in px (1-5)
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineColor?: string; // hex color

  // Label/Value pair properties
  labelText?: string; // The label part (e.g., "Date", "CIPL NO")
  separator?: string; // Separator between label and value (e.g., ":", "-", " ")
  labelBold?: boolean; // Whether label should be bold
  layout?: 'horizontal' | 'vertical'; // Layout direction

  // Rectangle properties
  borderWidth?: number; // in px (0-5, 0 = no border)
  borderColor?: string; // hex color
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  backgroundColor?: string; // hex color (transparent if not set)
  cornerRadius?: number; // in px (0-10)

  // Table properties
  rows?: number; // Number of rows (1-20)
  columns?: number; // Number of columns (1-10)
  cellData?: string[][]; // 2D array of cell data
  showBorders?: boolean; // Show cell borders
  autoNumber?: boolean; // Auto-fill cells with 1,2,3...
  headerRow?: boolean; // First row is header

  // CIPL Auto-increment properties
  ciplStartNumber?: number; // Starting number for CIPL (admin can set)
}

export interface LabelTemplate {
  name: string;
  width: number; // in mm
  height: number; // in mm
  elements: LabelElementData[];
}