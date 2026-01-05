/**
 * Excel Service Module
 * 
 * Public exports for the Excel service abstraction layer.
 */

export type { IExcelService, ExcelParseResult, HeaderMapping } from './IExcelService';
export { ExcelJSService } from './ExcelJSService';
export { ExcelServiceFactory } from './ExcelServiceFactory';
