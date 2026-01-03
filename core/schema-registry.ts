export interface DataFieldDef {
  id: string;        // Unique ID (e.g., 'f_mat')
  key: string;       // JSON key for binding (e.g., 'material')
  label: string;     // Sidebar Label (e.g., 'Material Number')
  type: 'text' | 'number' | 'date' | 'barcode' | 'image';
  isCustom?: boolean; // Flag for user-created fields
  isSystem?: boolean; // Flag for System Injected fields (e.g. Operator Name)
}

export const SYSTEM_KEYS = {
  OPERATOR_NAME: '__SYS_OPERATOR_NAME__',
  INPUT_QTY: '__SYS_INPUT_QTY__'
};

export const SYSTEM_TOKENS = {
  OPERATOR: `{{${SYSTEM_KEYS.OPERATOR_NAME}}}`,
  QTY: `{{${SYSTEM_KEYS.INPUT_QTY}}}`
};

// Default SAP MM60 Fields + System Fields
export const INITIAL_SCHEMA: DataFieldDef[] = [
  // SYSTEM FIELDS (Injected First)
  { 
    id: 'sys_operator', 
    key: SYSTEM_KEYS.OPERATOR_NAME, 
    label: 'Operator Name (User)', 
    type: 'text',
    isSystem: true 
  },
  { 
    id: 'sys_qty', 
    key: SYSTEM_KEYS.INPUT_QTY, 
    label: 'Item Qty (Input)', 
    type: 'number',
    isSystem: true 
  },
  
  // STANDARD FIELDS
  { id: 'f_mat', key: 'material', label: 'Material Number', type: 'text' },
  { id: 'f_desc', key: 'material_description', label: 'Material Description', type: 'text' },
  { id: 'f_qty', key: 'qty', label: 'Box Capacity (Master Data)', type: 'number' }, // Renamed to avoid confusion
  { id: 'f_plant', key: 'plant', label: 'Plant', type: 'text' },
  { id: 'f_sloc', key: 'storage_location', label: 'Storage Location', type: 'text' },
  { id: 'f_uom', key: 'base_unit_of_measure', label: 'Base UoM', type: 'text' },
  { id: 'f_mat_grp', key: 'material_group', label: 'Material Group', type: 'text' },
  { id: 'f_price', key: 'price', label: 'Price', type: 'number' },
  { id: 'f_curr', key: 'currency', label: 'Currency', type: 'text' },
  { id: 'f_created', key: 'created_by', label: 'Created By', type: 'text' },
  { id: 'f_date', key: 'last_change_date', label: 'Last Change Date', type: 'date' },
];