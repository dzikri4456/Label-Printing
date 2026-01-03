import React from 'react';
import { LabelTemplate, LabelElementData } from '../types';
import { LabelElement } from './LabelElement';
import { mmToPx, formatValue } from '../../../core/print-utils';
import { SYSTEM_KEYS } from '../../../core/schema-registry';
import { useUser } from '../../users/UserContext';

interface StaticLabelRendererProps {
  template: LabelTemplate;
  row: any;
}

export const StaticLabelRenderer: React.FC<StaticLabelRendererProps> = ({ template, row }) => {
  const widthPx = mmToPx(template.width);
  const heightPx = mmToPx(template.height);
  const { currentUser } = useUser();

  // --- LATE BINDING INTERCEPTOR ---
  const getDisplayValue = (element: LabelElementData) => {
    if (element.isDynamic && element.bindingKey) {
      
      // 1. INTERCEPT SYSTEM VARIABLES
      // Even though we are printing 100 different rows, this value 
      // comes from the active user session, NOT the excel row.
      if (element.bindingKey === SYSTEM_KEYS.OPERATOR_NAME) {
        return currentUser ? currentUser.name : '';
      }

      // 2. RESOLVE EXCEL DATA
      const val = row[element.bindingKey];
      if (val === undefined) return ``;
      return formatValue(val, element.format);
    }
    return element.value;
  };

  return (
    <div
      className="relative overflow-hidden bg-white mb-8 page-break-after"
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        // Force page break in print
        pageBreakAfter: 'always',
        breakAfter: 'page'
      }}
    >
      {template.elements.map((element) => (
        <LabelElement 
          key={element.id} 
          data={element} 
          isSelected={false}
          isPreview={true} // Always preview mode (no handles)
          displayValue={getDisplayValue(element)}
          onMouseDown={() => {}}
          onResizeMouseDown={() => {}}
        />
      ))}
    </div>
  );
};