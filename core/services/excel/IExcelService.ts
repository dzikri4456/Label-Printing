/**
 * Excel Service Interface
 * 
 * Abstraction layer for Excel file operations following the Repository Pattern.
 * This interface allows easy swapping of Excel libraries without affecting business logic.
 */

export interface IExcelService {
  /**
   * Parse an Excel file and return structured data
   * @param file - The Excel file to parse
   * @returns Promise with headers and data rows
   */
  parseToJSON(file: File): Promise<ExcelParseResult>;
  
  /**
   * Parse Excel file with custom header mapping
   * @param file - The Excel file to parse
   * @param headerMap - Optional mapping of Excel headers to object keys
   * @returns Promise with structured data
   */
  parseWithMapping(file: File, headerMap?: HeaderMapping): Promise<any[]>;
}

export interface ExcelParseResult {
  headers: string[];
  data: any[];
}

export interface HeaderMapping {
  [excelHeader: string]: string; // Maps Excel column name to object property
}
