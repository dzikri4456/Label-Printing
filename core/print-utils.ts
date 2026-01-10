import { Logger } from './logger';

// Conversion constant: 96 DPI / 25.4 mm per inch = 3.779527559055118
const PX_PER_MM = 3.779527559055118;

/**
 * THE UNIT CONVERSION DOCTRINE
 * 
 * Screen Reality: 96 DPI (Standard Web)
 * Physical Reality: 25.4 mm = 1 Inch
 * 
 * Precision Factor: 96 / 25.4 = 3.779527559055118...
 * We use the calculated value to minimize rounding errors over large distances.
 */

/**
 * Converts millimeters to screen pixels for rendering.
 * @param mm Millimeters
 * @returns Pixels (float) - Keeps high precision for CSS engine
 */
export const mmToPx = (mm: number): number => {
  return mm * PX_PER_MM;
};

/**
 * Converts screen pixels back to millimeters.
 * @param px Pixels
 * @returns Millimeters (float)
 */
export const pxToMm = (px: number): number => {
  return px / PX_PER_MM;
};

/**
 * Formats a value based on the specified format type.
 */
export const formatValue = (value: any, format?: string): string => {
  if (value === undefined || value === null) return '';
  if (!format || format === 'none') return String(value);

  try {
    // Barcode 39 Formatting
    if (format === 'barcode_39') {
      // Code 39 requires start/stop character '*'
      const str = String(value).toUpperCase();
      // Ensure we don't double wrap if data already has it
      if (str.startsWith('*') && str.endsWith('*')) return str;
      return `*${str}*`;
    }

    // Number Formatting
    if (format === 'currency_idr') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value));
    }
    if (format === 'currency_usd') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
    }

    // Date Formatting
    if (format === 'date_short' || format === 'date_long') {
      let dateObj: Date;
      // Handle Excel Serial Date
      if (typeof value === 'number' && value > 20000) {
        dateObj = new Date((value - 25569) * 86400 * 1000);
      } else {
        dateObj = new Date(value);
      }

      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat(format === 'date_short' ? 'id-ID' : 'en-US', {
          dateStyle: format === 'date_short' ? 'short' : 'full'
        }).format(dateObj);
      }
    }
  } catch (e) {
    Logger.warn('Formatting failed', { error: String(e) });
  }

  return String(value);
};