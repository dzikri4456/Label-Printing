/**
 * GLOBAL CONSTANTS & CONFIGURATION
 * Single source of truth for "Magic Numbers" and "Magic Strings".
 */

export const STORAGE_KEYS = {
  TEMPLATES: 'pla_label_templates',
};

export const TIMEOUTS = {
  MOCK_API_DELAY: 600,
  SAVE_DELAY: 800,
  BATCH_PRINT_DELAY: 500,
  BATCH_PRINT_CLEANUP: 2000,
  TOAST_DURATION: 3000,
};

export const DEFAULTS = {
  TEMPLATE: {
    WIDTH: 100,
    HEIGHT: 50,
    DEFAULT_NAME: 'New Template',
  },
  ELEMENT: {
    WIDTH: 40,
    HEIGHT_TEXT: 10,
    HEIGHT_BARCODE: 15,
    FONT_SIZE: 12,
  },
  UI: {
    MAX_NAME_LENGTH: 30,
    INPUT_DEBOUNCE_MS: 300,
  }
};

export const UNITS = {
  PX_PER_MM: 96 / 25.4,
};

export const PRINT_CONFIG = {
  BATCH_SIZE: 100, // Recommended max labels per DOM render
  WARNING_THRESHOLD: 500, // Trigger crash warning above this count
};