import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LabelTemplate, LabelElementData } from '../types';
import { pxToMm, formatValue } from '../../../core/print-utils';
import { DataFieldDef, SYSTEM_KEYS, SYSTEM_TOKENS } from '../../../core/schema-registry';
import { useData } from '../context/DataContext';
import { useTemplateContext } from '../context/TemplateContext';
import { DEFAULTS } from '../../../core/constants';
import { useUser } from '../../users/UserContext';
import { snapToGrid, snapPositionToGrid } from '../utils/gridUtils';

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

  // Grid settings
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(5); // 5mm grid
  const [snapEnabled, setSnapEnabled] = useState(false); // OFF by default for free movement
  const [rulersEnabled, setRulersEnabled] = useState(true);
  const [gridToolbarVisible, setGridToolbarVisible] = useState(true); // Toolbar visibility

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

  // Grid control functions
  const toggleGrid = useCallback(() => setGridEnabled(prev => !prev), []);
  const toggleSnap = useCallback(() => setSnapEnabled(prev => !prev), []);
  const toggleRulers = useCallback(() => setRulersEnabled(prev => !prev), []);
  const toggleGridToolbar = useCallback(() => setGridToolbarVisible(prev => !prev), []);
  const setGridSizeValue = useCallback((size: number) => setGridSize(size), []);

  // --- SMART DROP LOGIC (Updated with snap-to-grid) ---
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

    // Apply snap-to-grid
    if (snapEnabled) {
      const snapped = snapPositionToGrid(x_mm, y_mm, gridSize, true);
      x_mm = snapped.x;
      y_mm = snapped.y;
    }

    x_mm = Math.max(0, Math.min(x_mm, currentTemplate.width - 20));
    y_mm = Math.max(0, Math.min(y_mm, currentTemplate.height - 5));

    let elementValue = `{{${fieldDef.key}}}`;
    let isDynamic = true;
    let specificFontFamily = 'Helvetica';
    let specificFontSize: number = DEFAULTS.ELEMENT.FONT_SIZE;
    let specificFormat: any = 'none';

    // HANDLER 1: STATIC TEXT TOOL
    if (fieldDef.key === SYSTEM_KEYS.STATIC_TEXT) {
      elementValue = "Double Click to Edit";
      isDynamic = false;
    }
    // HANDLER 2: BARCODE FONT TOOL
    else if (fieldDef.key === SYSTEM_KEYS.BARCODE_FONT) {
      elementValue = '{{material}}';
      isDynamic = true;
      specificFontFamily = '3OF9';
      specificFontSize = 48;
      specificFormat = 'barcode_39';
      fieldDef.key = 'material';
    }
    // HANDLER 3: LINE TOOL - properties set after newElement creation
    // HANDLER 4: SYSTEM VARIABLES
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
      bindingKey: isDynamic ? fieldDef.key : undefined,
      schemaLabel: fieldDef.label,
      format: (fieldDef.key === SYSTEM_KEYS.VAR_DATE_ONLY) ? 'date_short' : specificFormat,
      fontSize: specificFontSize,
      fontFamily: specificFontFamily,
      fontWeight: 'normal',
      width: DEFAULTS.ELEMENT.WIDTH,
      height: fieldDef.type === 'barcode' ? DEFAULTS.ELEMENT.HEIGHT_BARCODE : DEFAULTS.ELEMENT.HEIGHT_TEXT
    };

    // Post-process for LINE element
    if (fieldDef.key === SYSTEM_KEYS.LINE) {
      newElement.type = 'line';
      newElement.value = '';
      newElement.isDynamic = false;
      newElement.lineThickness = 2;
      newElement.lineStyle = 'solid';
      newElement.lineColor = '#000000';
      newElement.width = currentTemplate?.width || 100;
      newElement.height = 1;
    }

    // Post-process for LABEL_VALUE element
    if (fieldDef.key === SYSTEM_KEYS.LABEL_VALUE) {
      newElement.type = 'label-value';
      newElement.labelText = 'Label';
      newElement.separator = ':';
      newElement.labelBold = true;
      newElement.layout = 'horizontal';
      newElement.value = '{{value}}';
      newElement.isDynamic = true;
      newElement.bindingKey = 'material'; // Default binding
      newElement.width = 60;
      newElement.height = 8;
    }

    // Post-process for RECTANGLE element
    if (fieldDef.key === SYSTEM_KEYS.RECTANGLE) {
      newElement.type = 'rectangle';
      newElement.value = '';
      newElement.isDynamic = false;
      newElement.borderWidth = 2;
      newElement.borderColor = '#000000';
      newElement.borderStyle = 'solid';
      newElement.backgroundColor = 'transparent';
      newElement.cornerRadius = 0;
      newElement.width = 50;
      newElement.height = 30;
    }

    // Post-process for TABLE element
    if (fieldDef.key === SYSTEM_KEYS.TABLE) {
      newElement.type = 'table';
      newElement.value = '';
      newElement.isDynamic = false;
      newElement.rows = 4;
      newElement.columns = 4;
      newElement.cellData = [];
      newElement.showBorders = true;
      newElement.autoNumber = true; // Default to auto-numbering like reference image
      newElement.headerRow = false;
      newElement.width = 60;
      newElement.height = 40;
      newElement.fontSize = 10;
    }

    // Post-process for CIPL_AUTO element
    if (fieldDef.key === SYSTEM_KEYS.CIPL_AUTO) {
      newElement.type = 'text'; // Render as text
      newElement.value = '{{CIPL}}'; // Special token
      newElement.isDynamic = true;
      newElement.bindingKey = '__CIPL_AUTO__'; // Special binding
      newElement.schemaLabel = 'CIPL Auto-Number';
      newElement.fontSize = 14;
      newElement.fontWeight = 'bold';
      newElement.width = 30;
      newElement.height = 8;
    }

    addElement(newElement);
  }, [addElement, snapEnabled, gridSize]);

  // --- MOUSE HANDLERS (With snap-to-grid) ---
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

  const handleElementDoubleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isPreviewMode) return;

    const currentTemplate = templateRef.current;
    const el = currentTemplate.elements.find(e => e.id === id);
    if (!el) return;

    if (!el.isDynamic && el.type === 'text') {
      const newVal = prompt("Edit Label Text:", el.value);
      if (newVal !== null) {
        updateElement(id, { value: newVal });
      }
    }
  }, [isPreviewMode, updateElement]);

  // Mouse move with snap-to-grid
  useEffect(() => {
    if (!isDragging || !selectedId || isPreviewMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const tmpl = templateRef.current;
      const dx_mm = pxToMm(e.clientX - dragRef.current.startX);
      const dy_mm = pxToMm(e.clientY - dragRef.current.startY);

      if (dragRef.current.mode === 'move') {
        let nx = dragRef.current.originalX + dx_mm;
        let ny = dragRef.current.originalY + dy_mm;

        // Apply snap-to-grid
        if (snapEnabled) {
          const snapped = snapPositionToGrid(nx, ny, gridSize, true);
          nx = snapped.x;
          ny = snapped.y;
        }

        nx = Math.max(0, Math.min(nx, dragRef.current.maxX));
        ny = Math.max(0, Math.min(ny, dragRef.current.maxY));
        updateElement(selectedId, { x: nx, y: ny });
      } else {
        let nw = Math.max(5, dragRef.current.originalWidth + dx_mm);
        let nh = Math.max(5, dragRef.current.originalHeight + dy_mm);

        // Apply snap-to-grid for size
        if (snapEnabled) {
          nw = snapToGrid(nw, gridSize, true);
          nh = snapToGrid(nh, gridSize, true);
        }

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
  }, [isDragging, selectedId, isPreviewMode, updateElement, snapEnabled, gridSize]);

  // Keyboard shortcuts (Delete + Arrow keys for nudging)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || isPreviewMode) return;
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectedId);
        return;
      }

      // Arrow keys for nudging
      const tmpl = templateRef.current;
      const el = tmpl.elements.find(e => e.id === selectedId);
      if (!el) return;

      let nudgeAmount = 1; // 1mm default
      if (e.shiftKey) nudgeAmount = 10; // 10mm with Shift
      if (e.ctrlKey || e.metaKey) nudgeAmount = 0.1; // 0.1mm with Ctrl (fine control)

      let newX = el.x;
      let newY = el.y;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newX = Math.max(0, el.x - nudgeAmount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newX = Math.min(tmpl.width - (el.width || 10), el.x + nudgeAmount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newY = Math.max(0, el.y - nudgeAmount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newY = Math.min(tmpl.height - (el.height || 10), el.y + nudgeAmount);
          break;
        default:
          return;
      }

      updateElement(selectedId, { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isPreviewMode, deleteElement, updateElement]);


  // --- LATE BINDING RESOLUTION (PREVIEW) ---
  const getElementDisplayValue = useCallback((element: LabelElementData): string => {
    if (isPreviewMode && element.isDynamic && element.bindingKey) {
      if (element.bindingKey === SYSTEM_KEYS.OPERATOR_NAME) return currentUser ? currentUser.name : '[Operator]';
      if (element.bindingKey === SYSTEM_KEYS.INPUT_QTY) return "100";
      if (element.bindingKey === SYSTEM_KEYS.INPUT_SALES) return "SO-123456";
      if (element.bindingKey === SYSTEM_KEYS.INPUT_PLAN) return "PLN-99";
      if (element.bindingKey === SYSTEM_KEYS.INPUT_REMARKS) return "Fragile Item";
      if (element.bindingKey === SYSTEM_KEYS.VAR_DEPT) return "Production";
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
    handleDropFromSidebar, handleElementMouseDown, handleResizeMouseDown, handleElementDoubleClick, handleCanvasClick, getElementDisplayValue,
    // Grid controls
    gridEnabled, gridSize, snapEnabled, rulersEnabled, gridToolbarVisible,
    toggleGrid, toggleSnap, toggleRulers, toggleGridToolbar, setGridSizeValue
  };
};

