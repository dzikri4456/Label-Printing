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
  // Use Context instead of local state for the Template Data
  const { activeTemplate, updateActiveTemplate } = useTemplateContext();
  const { currentUser } = useUser();
  
  if (!activeTemplate) {
      throw new Error("useLabelEditor called without an active template in context");
  }

  // --- PERFORMANCE OPTIMIZATION: REF PATTERN ---
  const templateRef = useRef<LabelTemplate>(activeTemplate);
  useEffect(() => {
    templateRef.current = activeTemplate;
  }, [activeTemplate]);

  // Local UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const { getActiveRow } = useData();

  // REFS for Drag & Resize Logic
  const dragRef = useRef({
    mode: 'move' as 'move' | 'resize',
    startX: 0,       
    startY: 0,       
    originalX: 0,    
    originalY: 0,
    originalWidth: 0,
    originalHeight: 0,    
    maxX: 0,         
    maxY: 0          
  });

  // --- ACTIONS (Now Stable) ---

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

  // --- SMART DROP LOGIC ---
  const handleDropFromSidebar = useCallback((e: React.DragEvent, canvasRect: DOMRect) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const currentTemplate = templateRef.current;
    const fieldDef: DataFieldDef = JSON.parse(dataStr);
    
    // Calculate drop position relative to the Canvas
    const dropX_px = e.clientX - canvasRect.left;
    const dropY_px = e.clientY - canvasRect.top;
    
    let x_mm = pxToMm(dropX_px);
    let y_mm = pxToMm(dropY_px);
    
    // Boundary check using current ref
    x_mm = Math.max(0, Math.min(x_mm, currentTemplate.width - 20));
    y_mm = Math.max(0, Math.min(y_mm, currentTemplate.height - 5));

    // SYSTEM TOKEN LOGIC
    let elementValue = `{{${fieldDef.key}}}`;
    
    if (fieldDef.key === SYSTEM_KEYS.OPERATOR_NAME) {
       elementValue = SYSTEM_TOKENS.OPERATOR;
    } else if (fieldDef.key === SYSTEM_KEYS.INPUT_QTY) {
       elementValue = '{{Qty}}'; // User friendly placeholder
    }

    const newElement: LabelElementData = {
      id: generateId(),
      type: fieldDef.type === 'barcode' ? 'barcode' : 'text', 
      x: x_mm,
      y: y_mm,
      value: elementValue,
      isDynamic: true,
      bindingKey: fieldDef.key,
      schemaLabel: fieldDef.label, 
      format: 'none',
      fontSize: DEFAULTS.ELEMENT.FONT_SIZE,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      width: DEFAULTS.ELEMENT.WIDTH, 
      height: fieldDef.type === 'barcode' ? DEFAULTS.ELEMENT.HEIGHT_BARCODE : DEFAULTS.ELEMENT.HEIGHT_TEXT 
    };

    addElement(newElement);
  }, [addElement]);

  // --- MOUSE HANDLERS (Stable) ---

  const handleCanvasClick = useCallback(() => {
    setSelectedId((prev) => prev ? null : prev); 
  }, []);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);

    const currentTemplate = templateRef.current;
    const element = currentTemplate.elements.find(el => el.id === id);
    if (!element) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    const elWidthMm = element.width || pxToMm(rect.width);
    const elHeightMm = element.height || pxToMm(rect.height);

    dragRef.current = {
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      originalX: element.x,
      originalY: element.y,
      originalWidth: elWidthMm,
      originalHeight: elHeightMm,
      maxX: Math.max(0, currentTemplate.width - elWidthMm),
      maxY: Math.max(0, currentTemplate.height - elHeightMm)
    };
    setIsDragging(true);
  }, []); 

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    
    const currentTemplate = templateRef.current;
    const element = currentTemplate.elements.find(el => el.id === id);
    if (!element) return;

    const currentWidth = element.width || 10; 
    const currentHeight = element.height || 10;

    dragRef.current = {
      mode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      originalX: element.x,
      originalY: element.y,
      originalWidth: currentWidth,
      originalHeight: currentHeight,
      maxX: currentTemplate.width,
      maxY: currentTemplate.height 
    };
    setIsDragging(true);
  }, []); 

  // --- GLOBAL EVENT LISTENERS ---
  useEffect(() => {
    if (!isDragging || !selectedId || isPreviewMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const tmpl = templateRef.current;
      
      const deltaX_px = e.clientX - dragRef.current.startX;
      const deltaY_px = e.clientY - dragRef.current.startY;
      const deltaX_mm = pxToMm(deltaX_px);
      const deltaY_mm = pxToMm(deltaY_px);

      if (dragRef.current.mode === 'move') {
        let newX = dragRef.current.originalX + deltaX_mm;
        let newY = dragRef.current.originalY + deltaY_mm;
        // Clamp
        newX = Math.max(0, Math.min(newX, dragRef.current.maxX));
        newY = Math.max(0, Math.min(newY, dragRef.current.maxY));
        
        updateElement(selectedId, { x: newX, y: newY });
      } else {
        // Resize Logic
        let newWidth = Math.max(5, dragRef.current.originalWidth + deltaX_mm); 
        let newHeight = Math.max(5, dragRef.current.originalHeight + deltaY_mm); 

        if (dragRef.current.originalX + newWidth > tmpl.width) {
          newWidth = tmpl.width - dragRef.current.originalX;
        }
        if (dragRef.current.originalY + newHeight > tmpl.height) {
          newHeight = tmpl.height - dragRef.current.originalY;
        }

        updateElement(selectedId, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedId, isPreviewMode, updateElement]);

  // --- KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || isPreviewMode) return;
      const tagName = (e.target as HTMLElement).tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isPreviewMode, deleteElement]);

  // --- LATE BINDING RESOLUTION (DESIGNER PREVIEW MODE) ---
  const getElementDisplayValue = useCallback((element: LabelElementData): string => {
    if (isPreviewMode && element.isDynamic && element.bindingKey) {
      
      // 1. SYSTEM VARIABLE INTERCEPTOR
      if (element.bindingKey === SYSTEM_KEYS.OPERATOR_NAME) {
         return currentUser ? currentUser.name : '[Unknown Operator]';
      }
      if (element.bindingKey === SYSTEM_KEYS.INPUT_QTY) {
         return "100"; // Dummy Preview Value
      }

      // 2. EXCEL DATA BINDING
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
    selectedId,
    isPreviewMode,
    updateElement,
    addElement,
    deleteElement,
    togglePreviewMode,
    handleDropFromSidebar,
    handleElementMouseDown,
    handleResizeMouseDown,
    handleCanvasClick,
    getElementDisplayValue
  };
};