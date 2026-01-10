export interface DataFieldDef {
  id: string;        // Unique ID (e.g., 'f_mat')
  key: string;       // JSON key for binding (e.g., 'material')
  label: string;     // Sidebar Label (e.g., 'Material Number')
  type: 'text' | 'number' | 'date' | 'barcode' | 'image' | 'static_text';
  isCustom?: boolean; // Flag for user-created fields
  isSystem?: boolean; // Flag for System Injected fields (e.g. Operator Name)
}

export const SYSTEM_KEYS = {
  OPERATOR_NAME: '__SYS_OPERATOR_NAME__',
  INPUT_QTY: '__SYS_INPUT_QTY__',
  // NEW FIELDS
  INPUT_SALES: '__SYS_INPUT_SALES__',
  INPUT_PLAN: '__SYS_INPUT_PLAN__',
  INPUT_REMARKS: '__SYS_INPUT_REMARKS__', // Keterangan
  VAR_DEPT: '__SYS_DEPT__',
  VAR_DATE_ONLY: '__SYS_DATE_ONLY__',
  STATIC_TEXT: '__STATIC_TEXT_TOOL__', // Pseudo-key for tool
  BARCODE_FONT: '__TOOL_BARCODE_FONT__', // New Barcode Font Tool
  LINE: '__TOOL_LINE__', // Horizontal Line Tool
  LABEL_VALUE: '__TOOL_LABEL_VALUE__', // Label/Value Pair Tool
  RECTANGLE: '__TOOL_RECTANGLE__', // Rectangle/Box Tool
  TABLE: '__TOOL_TABLE__', // Table/Grid Tool
  CIPL_AUTO: '__TOOL_CIPL_AUTO__' // CIPL Auto-Increment Tool
};

export const SYSTEM_TOKENS = {
  OPERATOR: `{{${SYSTEM_KEYS.OPERATOR_NAME}}}`,
  QTY: `{{${SYSTEM_KEYS.INPUT_QTY}}}`
};

// Default SAP MM60 Fields + System Fields
export const INITIAL_SCHEMA: DataFieldDef[] = [
  // --- SECTION A: TOOLS ---
  {
    id: 'tool_static',
    key: SYSTEM_KEYS.STATIC_TEXT,
    label: 'Static Text (Label)',
    type: 'static_text',
    isSystem: true
  },
  {
    id: 'tool_bc_font',
    key: SYSTEM_KEYS.BARCODE_FONT,
    label: 'Barcode (Mat. No)',
    type: 'text',
    isSystem: true
  },
  {
    id: 'tool_line',
    key: SYSTEM_KEYS.LINE,
    label: 'Horizontal Line',
    type: 'text', // Using 'text' type for now, will extend later
    isSystem: true
  },
  {
    id: 'tool_label_value',
    key: SYSTEM_KEYS.LABEL_VALUE,
    label: 'Label/Value Pair',
    type: 'text',
    isSystem: true
  },
  {
    id: 'tool_rectangle',
    key: SYSTEM_KEYS.RECTANGLE,
    label: 'Rectangle/Box',
    type: 'text',
    isSystem: true
  },
  {
    id: 'tool_table',
    key: SYSTEM_KEYS.TABLE,
    label: 'Table/Grid',
    type: 'text',
    isSystem: true
  },
  {
    id: 'tool_cipl_auto',
    key: SYSTEM_KEYS.CIPL_AUTO,
    label: 'CIPL Auto-Number',
    type: 'text',
    isSystem: true
  },

  // --- SECTION B: DYNAMIC INPUTS (User types at print time) ---
  {
    id: 'sys_qty',
    key: SYSTEM_KEYS.INPUT_QTY,
    label: 'Item Qty (Input)',
    type: 'number',
    isSystem: true
  },
  {
    id: 'sys_remarks',
    key: SYSTEM_KEYS.INPUT_REMARKS,
    label: 'Keterangan (Input)',
    type: 'text',
    isSystem: true
  },
  {
    id: 'sys_sales',
    key: SYSTEM_KEYS.INPUT_SALES,
    label: 'Sales Order (Input)',
    type: 'text',
    isSystem: true
  },
  {
    id: 'sys_plan',
    key: SYSTEM_KEYS.INPUT_PLAN,
    label: 'Plan / Batch (Input)',
    type: 'text',
    isSystem: true
  },

  // --- SECTION C: SYSTEM VARIABLES (Read Only) ---
  {
    id: 'sys_date',
    key: SYSTEM_KEYS.VAR_DATE_ONLY,
    label: 'Date (dd-MM-yyyy)',
    type: 'date',
    isSystem: true
  },
  {
    id: 'sys_dept',
    key: SYSTEM_KEYS.VAR_DEPT,
    label: 'Department (User)',
    type: 'text',
    isSystem: true
  },
  {
    id: 'sys_operator',
    key: SYSTEM_KEYS.OPERATOR_NAME,
    label: 'Operator Name',
    type: 'text',
    isSystem: true
  },

  // --- SECTION D: MASTER DATA ---
  { id: 'f_mat', key: 'material', label: 'Material Number', type: 'text' },
  { id: 'f_desc', key: 'material_description', label: 'Material Description', type: 'text' },
  { id: 'f_uom', key: 'base_unit_of_measure', label: 'Base UoM', type: 'text' },
];