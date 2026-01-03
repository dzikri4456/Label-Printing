import * as XLSX from 'xlsx';

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({ headers: [], data: [] });
          return;
        }

        // Row 0 is Headers
        const rawHeaders = (jsonData[0] as string[]).map(h => String(h).trim());
        
        // CRITICAL FIX: The headers returned in the result MUST be the sanitized keys.
        // The UI Table iterates these headers to look up values in the row objects.
        const sanitizedHeaders = rawHeaders.map(h => sanitizeKey(h));

        const rawRows = jsonData.slice(1);

        // DATA NORMALIZATION DOCTRINE:
        // Convert the raw row array into an object using the SANITIZED keys.
        // This ensures that row['material_description'] exists and matches the header 'material_description'.
        const structuredData = rawRows.map((row: any) => {
          const obj: Record<string, any> = {};
          rawHeaders.forEach((_, index) => {
            const key = sanitizedHeaders[index];
            // If the cell is empty, store empty string instead of undefined
            obj[key] = row[index] !== undefined ? row[index] : ""; 
          });
          return obj;
        });

        resolve({ headers: sanitizedHeaders, data: structuredData });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};