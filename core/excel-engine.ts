import { ExcelServiceFactory } from './services/excel';

export interface ParseResult {
  headers: string[]; // Returns SANITIZED headers (keys)
  data: any[];
}

/**
 * Sanitizes a header string to be a valid binding key (snake_case)
 * e.g. "Material Description" -> "material_description"
 */
export const sanitizeKey = (header: string): string => {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_');        // Replace spaces with underscores
};

export const parseExcel = async (file: File): Promise<ParseResult> => {
  try {
    const excelService = ExcelServiceFactory.getService();
    const result = await excelService.parseToJSON(file);

    if (result.data.length === 0) {
      return { headers: [], data: [] };
    }

    // Row 0 is Headers
    const rawHeaders = result.headers;

    // CRITICAL FIX: The headers returned in the result MUST be the sanitized keys.
    // The UI Table iterates these headers to look up values in the row objects.
    const sanitizedHeaders = rawHeaders.map(h => sanitizeKey(h));

    // DATA NORMALIZATION DOCTRINE:
    // Convert the raw row array into an object using the SANITIZED keys.
    // This ensures that row['material_description'] exists and matches the header 'material_description'.
    const structuredData = result.data.map((row: any) => {
      const obj: Record<string, any> = {};
      rawHeaders.forEach((rawHeader, index) => {
        const key = sanitizedHeaders[index];
        // If the cell is empty, store empty string instead of undefined
        if (rawHeader && key) {
          obj[key] = row[rawHeader] !== undefined ? row[rawHeader] : "";
        }
      });
      return obj;
    });

    return { headers: sanitizedHeaders, data: structuredData };

  } catch (err) {
    throw err;
  }
};
