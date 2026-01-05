import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LabelTemplate, LabelElementData } from '../types';
import { pxToMm, formatValue } from '../../../core/print-utils';
import { DataFieldDef, SYSTEM_KEYS, SYSTEM_TOKENS } from '../../../core/schema-registry';
import { useData } from '../context/DataContext';
import { useTemplateContext } from '../context/TemplateContext';
import { DEFAULTS } from '../../../core/constants';
import { useUser } from '../../users/UserContext';

// Helper for ID generation
const generateId = () => `el-${Math.random().toString(36).substr(2, 9)}`;

export const useLabelEditor = () => {
  const { activeTemplate, updateActiveTemplate } = useTemplateContext();
  const { currentUser } = useUser();
  
  if (!activeTemplate) {
      throw new Error("useLabelEditor called without an active template in context");
  }

  const templateRef = useRef<LabelTemplate>(activeTemplate);
  useEffect(() => {
    templateRef.current = activeTemplate;
  }, [activeTemplate]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const { getActiveRow } = useData();

  const dragRef = useRef({
    mode: 'move' as 'move' | 'resize',
    startX: 0, startY: 0, originalX: 0, originalY: 0,
    originalWidth: 0, originalHeight: 0, maxX: 0, maxY: 0          
  });

  const updateElement = useCallback((id: string, updates: Partial<LabelElementData>) => {
    const currentTemplate = templateRef.current;
    const el = currentTemplate.elements.find(e => e.id === id);
    if (!el) return;

    updateActiveTemplate({
      elements: currentTemplate.elements.map((el) => 
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  }, [updateActiveTemplate]);

  const addElement = useCallback((element: LabelElementData) => {
    const currentTemplate = templateRef.current;
    updateActiveTemplate({
      elements: [...currentTemplate.elements, element]
    });
    setSelectedId(element.id);
  }, [updateActiveTemplate]);

  const deleteElement = useCallback((id: string) => {
    const currentTemplate = templateRef.current;
    updateActiveTemplate({
      elements: currentTemplate.elements.filter(el => el.id !== id)
    });
    setSelectedId(null);
  }, [updateActiveTemplate]);

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode(prev => {
      if (!prev) setSelectedId(null); 
      return !prev;
    });
  }, []);

  // --- SMART DROP LOGIC (Updated for Static & Sys Vars) ---
  const handleDropFromSidebar = useCallback((e: React.DragEvent, canvasRect: DOMRect) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const currentTemplate = templateRef.current;
    const fieldDef: DataFieldDef = JSON.parse(dataStr);
    
    const dropX_px = e.clientX - canvasRect.left;
    const dropY_px = e.clientY - canvasRect.top;
    
    let x_mm = pxToMm(dropX_px);
    let y_mm = pxToMm(dropY_px);
    x_mm = Math.max(0, Math.min(x_mm, currentTemplate.width - 20));
    y_mm = Math.max(0, Math.min(y_mm, currentTemplate.height - 5));

    let elementValue = `{{${fieldDef.key}}}`;
    let isDynamic = true;
    let specificFontFamily = 'Arial';
    let specificFontSize = DEFAULTS.ELEMENT.FONT_SIZE;
    let specificFormat: any = 'none';

    // HANDLER 1: STATIC TEXT TOOL
    if (fieldDef.key === SYSTEM_KEYS.STATIC_TEXT) {
       elementValue = "Double Click to Edit";
       isDynamic = false; // Important: This makes it a standard text box
    }
    // HANDLER 2: BARCODE FONT TOOL
    else if (fieldDef.key === SYSTEM_KEYS.BARCODE_FONT) {
       elementValue = '{{material}}'; // Default binding to material
       isDynamic = true;
       specificFontFamily = 'LocalBarcodeFont';
       specificFontSize = 48; // Readable size for barcode
       specificFormat = 'barcode_39';
       // Re-map binding key to material because that's what the requirement said
       // But we must check if 'material' exists in schema? Usually it does as core field.
       fieldDef.key = 'material'; 
    }
    // HANDLER 3: SYSTEM VARIABLES
    else if (fieldDef.key === SYSTEM_KEYS.OPERATOR_NAME) {
       elementValue = SYSTEM_TOKENS.OPERATOR;
    } else if (fieldDef.key === SYSTEM_KEYS.INPUT_QTY) {
       elementValue = '{{Qty}}';
    } else if (fieldDef.key === SYSTEM_KEYS.INPUT_REMARKS) {
       elementValue = '{{Rem}}';
    } else if (fieldDef.key === SYSTEM_KEYS.INPUT_SALES) {
       elementValue = '{{SO}}';
    } else if (fieldDef.key === SYSTEM_KEYS.INPUT_PLAN) {
       elementValue = '{{Plan}}';
    } else if (fieldDef.key === SYSTEM_KEYS.VAR_DATE_ONLY) {
       elementValue = '{{Date}}';
    } else if (fieldDef.key === SYSTEM_KEYS.VAR_DEPT) {
       elementValue = '{{Dept}}';
    }

    const newElement: LabelElementData = {
      id: generateId(),
      type: fieldDef.type === 'barcode' ? 'barcode' : 'text', 
      x: x_mm,
      y: y_mm,
      value: elementValue,
      isDynamic: isDynamic,
      bindingKey: isDynamic ? fieldDef.key : undefined, // Only bind if dynamic
      schemaLabel: fieldDef.label, 
      format: (fieldDef.key === SYSTEM_KEYS.VAR_DATE_ONLY) ? 'date_short' : specificFormat,
      fontSize: specificFontSize,
      fontFamily: specificFontFamily,
      fontWeight: 'normal',
      width: DEFAULTS.ELEMENT.WIDTH, 
      height: fieldDef.type === 'barcode' ? DEFAULTS.ELEMENT.HEIGHT_BARCODE : DEFAULTS.ELEMENT.HEIGHT_TEXT 
    };

    addElement(newElement);
  }, [addElement]);

  // --- MOUSE HANDLERS (Standard) ---
  const handleCanvasClick = useCallback(() => setSelectedId(prev => prev ? null : prev), []);
  
  const handleElementMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const tmpl = templateRef.current;
    const el = tmpl.elements.find(el => el.id === id);
    if (!el) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    dragRef.current = {
      mode: 'move',
      startX: e.clientX, startY: e.clientY,
      originalX: el.x, originalY: el.y,
      originalWidth: el.width || pxToMm(rect.width),
      originalHeight: el.height || pxToMm(rect.height),
      maxX: Math.max(0, tmpl.width - (el.width || pxToMm(rect.width))),
      maxY: Math.max(0, tmpl.height - (el.height || pxToMm(rect.height)))
    };
    setIsDragging(true);
  }, []); 

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    const tmpl = templateRef.current;
    const el = tmpl.elements.find(el => el.id === id);
    if (!el) return;
    dragRef.current = {
      mode: 'resize',
      startX: e.clientX, startY: e.clientY,
      originalX: el.x, originalY: el.y,
      originalWidth: el.width || 10, originalHeight: el.height || 10,
      maxX: tmpl.width, maxY: tmpl.height 
    };
    setIsDragging(true);
  }, []); 

  // --- NEW: DOUBLE CLICK HANDLER FOR STATIC TEXT ---
  const handleElementDoubleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isPreviewMode) return;
    
    const currentTemplate = templateRef.current;
    const el = currentTemplate.elements.find(e => e.id === id);
    if (!el) return;

    // Only allow editing if it's NOT dynamic (Static Text)
    if (!el.isDynamic && el.type === 'text') {
      const newVal = prompt("Edit Label Text:", el.value);
      if (newVal !== null) {
        updateElement(id, { value: newVal });
      }
    }
  }, [isPreviewMode, updateElement]);

  useEffect(() => {
    if (!isDragging || !selectedId || isPreviewMode) return;
    const handleMouseMove = (e: MouseEvent) => {
      const tmpl = templateRef.current;
      const dx_mm = pxToMm(e.clientX - dragRef.current.startX);
      const dy_mm = pxToMm(e.clientY - dragRef.current.startY);

      if (dragRef.current.mode === 'move') {
        let nx = dragRef.current.originalX + dx_mm;
        let ny = dragRef.current.originalY + dy_mm;
        nx = Math.max(0, Math.min(nx, dragRef.current.maxX));
        ny = Math.max(0, Math.min(ny, dragRef.current.maxY));
        updateElement(selectedId, { x: nx, y: ny });
      } else {
        let nw = Math.max(5, dragRef.current.originalWidth + dx_mm); 
        let nh = Math.max(5, dragRef.current.originalHeight + dy_mm); 
        if (dragRef.current.originalX + nw > tmpl.width) nw = tmpl.width - dragRef.current.originalX;
        if (dragRef.current.originalY + nh > tmpl.height) nh = tmpl.height - dragRef.current.originalY;
        updateElement(selectedId, { width: nw, height: nh });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedId, isPreviewMode, updateElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || isPreviewMode) return;
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteElement(selectedId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isPreviewMode, deleteElement]);

  // --- LATE BINDING RESOLUTION (PREVIEW) ---
  const getElementDisplayValue = useCallback((element: LabelElementData): string => {
    if (isPreviewMode && element.isDynamic && element.bindingKey) {
      if (element.bindingKey === SYSTEM_KEYS.OPERATOR_NAME) return currentUser ? currentUser.name : '[Operator]';
      if (element.bindingKey === SYSTEM_KEYS.INPUT_QTY) return "100"; 
      if (element.bindingKey === SYSTEM_KEYS.INPUT_SALES) return "SO-123456";
      if (element.bindingKey === SYSTEM_KEYS.INPUT_PLAN) return "PLN-99";
      if (element.bindingKey === SYSTEM_KEYS.INPUT_REMARKS) return "Fragile Item";
      if (element.bindingKey === SYSTEM_KEYS.VAR_DEPT) return "Production"; // Dummy for designer
      if (element.bindingKey === SYSTEM_KEYS.VAR_DATE_ONLY) return new Date().toLocaleDateString('en-GB');
      
      const activeRow = getActiveRow();
      if (activeRow) {
        const rawValue = activeRow[element.bindingKey];
        const val = (rawValue !== undefined && rawValue !== null) ? rawValue : "";
        return formatValue(val, element.format);
      }
      return `[${element.bindingKey}]`;
    }
    return element.value;
  }, [isPreviewMode, getActiveRow, currentUser]);

  return {
    selectedId, isPreviewMode, updateElement, addElement, deleteElement, togglePreviewMode,
    handleDropFromSidebar, handleElementMouseDown, handleResizeMouseDown, handleElementDoubleClick, handleCanvasClick, getElementDisplayValue
  };
};