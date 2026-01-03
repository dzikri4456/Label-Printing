import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DataFieldDef, INITIAL_SCHEMA } from '../../../core/schema-registry';
import { sanitizeKey } from '../../../core/excel-engine';
import { productRepository } from '../../products/product-repository';

interface SchemaContextType {
  fields: DataFieldDef[];
  addField: (field: DataFieldDef) => void;
  updateField: (id: string, updates: Partial<DataFieldDef>) => void;
  deleteField: (id: string) => void;
  syncFromHeaders: (headers: string[]) => void;
  replaceSchema: (newFields: DataFieldDef[]) => void; 
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export const SchemaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fields, setFields] = useState<DataFieldDef[]>(INITIAL_SCHEMA);

  // AUTO-SYNC WITH GLOBAL MASTER DATA
  // If the repository has data, ensure the schema reflects it so users can drag-and-drop fields.
  useEffect(() => {
    const products = productRepository.getAll();
    if (products.length > 0) {
      // Use the first record to guess schema keys
      // The product repository returns normalized keys (code, name, uom) + any extras
      // We map 'code' -> 'material', 'name' -> 'material_description' to match INITIAL_SCHEMA conventions if possible,
      // or just add them as available fields.
      
      const sample = products[0];
      const keys = Object.keys(sample);
      
      // We assume product-repository normalizes to: code, name, uom.
      // We map these to the standard SAP keys used in INITIAL_SCHEMA.
      // If we find keys that are NOT in the schema, we add them.
      
      // Standard Mapping
      const mapping: Record<string, string> = {
          'code': 'material',
          'name': 'material_description',
          'uom': 'base_unit_of_measure'
      };

      const availableKeys = keys.map(k => mapping[k] || k);
      syncFromHeaders(availableKeys);
    }
  }, []);

  const addField = (field: DataFieldDef) => {
    setFields((prev) => [...prev, field]);
  };

  const updateField = (id: string, updates: Partial<DataFieldDef>) => {
    setFields((prev) => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields((prev) => prev.filter(f => f.id !== id));
  };

  // Used when loading a saved template
  const replaceSchema = (newFields: DataFieldDef[]) => {
    // DOCTRINE: System Fields must ALWAYS be present.
    // If the saved template is old, it might miss the system fields.
    // We merge the saved custom fields with the default core/system fields.
    
    // 1. Identify System fields from INITIAL_SCHEMA
    const systemFields = INITIAL_SCHEMA.filter(f => f.isSystem);
    const systemKeys = new Set(systemFields.map(f => f.key));

    // 2. Filter incoming fields (remove any duplicates of system fields if they exist)
    const incomingClean = (newFields || []).filter(f => !systemKeys.has(f.key));
    
    // 3. If incoming is empty (new template), just reset to INITIAL
    if (incomingClean.length === 0) {
      setFields(INITIAL_SCHEMA);
      return;
    }

    // 4. Merge: System Fields First + Incoming Custom Fields
    // Note: We might lose "Core" fields if we are not careful, but usually newFields contains everything saved.
    // To be safe, let's trust the saved template but PREPEND system fields if missing.
    setFields([...systemFields, ...incomingClean]);
  };

  // Auto-generate schema fields from Excel Headers (or Repository Keys)
  const syncFromHeaders = (headers: string[]) => {
    setFields((prevFields) => {
      const newFields = [...prevFields];
      let addedCount = 0;

      headers.forEach(header => {
        // Sanitize for key (e.g. "Batch No" -> "BatchNo")
        const key = sanitizeKey(header);
        
        // Check if key already exists in schema (avoid duplicates)
        const exists = newFields.some(f => f.key.toLowerCase() === key.toLowerCase());
        
        if (!exists) {
          newFields.push({
            id: `auto_${Date.now()}_${addedCount++}`,
            key: key,
            label: header, // Use original header as label
            type: 'text',
            isCustom: true
          });
        }
      });
      return newFields;
    });
  };

  return (
    <SchemaContext.Provider value={{ fields, addField, updateField, deleteField, syncFromHeaders, replaceSchema }}>
      {children}
    </SchemaContext.Provider>
  );
};

export const useSchema = () => {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error('useSchema must be used within a SchemaProvider');
  }
  return context;
};