export type ElementType = 'text' | 'barcode';
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
}

export interface LabelTemplate {
  name: string;
  width: number; // in mm
  height: number; // in mm
  elements: LabelElementData[];
}