/**
 * Paper Size Presets
 * Standard paper sizes in millimeters for label template creation
 */

export interface PaperSize {
  name: string;
  width: number;  // mm
  height: number; // mm
  category: 'standard' | 'label' | 'custom';
  description?: string;
}

// Standard Paper Sizes (Portrait orientation)
export const PAPER_SIZES: Record<string, PaperSize> = {
  // ISO A Series
  A3: { name: 'A3', width: 297, height: 420, category: 'standard', description: '297 × 420 mm' },
  A4: { name: 'A4', width: 210, height: 297, category: 'standard', description: '210 × 297 mm' },
  A5: { name: 'A5', width: 148, height: 210, category: 'standard', description: '148 × 210 mm' },
  A6: { name: 'A6', width: 105, height: 148, category: 'standard', description: '105 × 148 mm' },

  // ISO B Series
  B4: { name: 'B4', width: 250, height: 353, category: 'standard', description: '250 × 353 mm' },
  B5: { name: 'B5', width: 176, height: 250, category: 'standard', description: '176 × 250 mm' },

  // North American
  LETTER: { name: 'Letter', width: 216, height: 279, category: 'standard', description: '8.5" × 11" (216 × 279 mm)' },
  LEGAL: { name: 'Legal', width: 216, height: 356, category: 'standard', description: '8.5" × 14" (216 × 356 mm)' },
  TABLOID: { name: 'Tabloid', width: 279, height: 432, category: 'standard', description: '11" × 17" (279 × 432 mm)' },

  // Folio
  F4: { name: 'F4 (Folio)', width: 210, height: 330, category: 'standard', description: '210 × 330 mm' },

  // Common Label Sizes for Zebra Printers
  LABEL_100x50: { name: '100×50mm Label', width: 100, height: 50, category: 'label', description: 'Standard shipping label' },
  LABEL_100x100: { name: '100×100mm Label', width: 100, height: 100, category: 'label', description: 'Square label' },
  LABEL_100x150: { name: '100×150mm Label', width: 100, height: 150, category: 'label', description: 'Large shipping label' },
  LABEL_58x40: { name: '58×40mm Label', width: 58, height: 40, category: 'label', description: 'Small product label' },
  LABEL_76x25: { name: '76×25mm Label', width: 76, height: 25, category: 'label', description: 'Barcode label' },
  LABEL_102x152: { name: '4"×6" Label', width: 102, height: 152, category: 'label', description: '4×6 inch shipping label' },
};

// Helper function to get paper size by name
export const getPaperSize = (name: string): PaperSize | undefined => {
  return PAPER_SIZES[name];
};

// Helper function to get all paper sizes by category
export const getPaperSizesByCategory = (category: 'standard' | 'label' | 'custom'): PaperSize[] => {
  return Object.values(PAPER_SIZES).filter(size => size.category === category);
};

// Helper function to rotate paper size (swap width and height)
export const rotatePaperSize = (size: PaperSize): PaperSize => {
  return {
    ...size,
    width: size.height,
    height: size.width,
    name: `${size.name} (Landscape)`,
    description: size.description ? `${size.description} - Landscape` : undefined
  };
};

/**
 * Printer DPI Constants
 */
export const PRINTER_DPI = {
  SCREEN: 96,                // Standard screen DPI
  ZEBRA_ZT510_203DPI: 203,   // Zebra ZT510 printer DPI
  ZEBRA_ZT510_300DPI: 300,   // Zebra ZT510 printer DPI (high res)
  ZEBRA_ZT230: 203,          // Zebra ZT230 printer DPI
  ZEBRA_ZT410: 300,          // Zebra ZT410 printer DPI (high res)
} as const;

/**
 * Unit Conversion Helpers
 */
export const mmToPx = (mm: number, dpi: number = PRINTER_DPI.SCREEN): number => {
  const pxPerMm = (dpi / 25.4);
  return mm * pxPerMm;
};

export const pxToMm = (px: number, dpi: number = PRINTER_DPI.SCREEN): number => {
  const pxPerMm = (dpi / 25.4);
  return px / pxPerMm;
};

/**
 * Get print scale factor for a specific printer
 */
export const getPrintScaleFactor = (printerDpi: number = PRINTER_DPI.ZEBRA_ZT510_203DPI): number => {
  return PRINTER_DPI.SCREEN / printerDpi;
};

/**
 * Default Values
 */
export const DEFAULTS = {
  TEMPLATE: {
    WIDTH: 100,  // mm
    HEIGHT: 50,  // mm
  },
  ELEMENT: {
    WIDTH: 40,           // mm
    HEIGHT_TEXT: 10,     // mm
    HEIGHT_BARCODE: 25,  // mm
    FONT_SIZE: 10,       // pt
  },
  UI: {
    MAX_NAME_LENGTH: 50,
  },
} as const;

/**
 * Print Configuration
 */
export const PRINT_CONFIG = {
  BATCH_SIZE: 50,
  WARNING_THRESHOLD: 100,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  TEMPLATES: 'label_templates',
  PRODUCTS: 'master_products',
  USERS: 'app_users',
  DEPARTMENTS: 'app_departments',
} as const;

/**
 * Timeouts
 */
export const TIMEOUTS = {
  MOCK_API_DELAY: 300,       // ms
  TOAST_DURATION: 3000,      // ms
  SAVE_DELAY: 300,           // ms
  DEBOUNCE_SEARCH: 300,      // ms
  BATCH_PRINT_CLEANUP: 500,  // ms
  BATCH_PRINT_DELAY: 100,    // ms
} as const;