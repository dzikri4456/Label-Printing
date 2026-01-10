/**
 * ExcelJS Implementation of IExcelService
 * 
 * Uses the ExcelJS library to parse Excel files.
 * This implementation can be easily swapped with another by changing the factory.
 */

import ExcelJS from 'exceljs';
import { IExcelService, ExcelParseResult, HeaderMapping } from './IExcelService';

export class ExcelJSService implements IExcelService {
    async parseToJSON(file: File): Promise<ExcelParseResult> {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return { headers: [], data: [] };
        }

        const jsonData: any[][] = [];
        worksheet.eachRow((row) => {
            // ExcelJS row.values is a sparse array-like object, convert to array and remove first empty element
            const rowValues = Array.isArray(row.values) ? row.values : Array.from(row.values as any);
            jsonData.push(rowValues.slice(1));
        });

        if (jsonData.length === 0) {
            return { headers: [], data: [] };
        }

        const headers = (jsonData[0] || []).map(h => String(h || '').trim()).filter(h => h.length > 0);
        const dataRows = jsonData.slice(1);

        const structuredData = dataRows.map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((header, idx) => {
                if (header) {
                    obj[header] = row[idx] !== undefined ? row[idx] : "";
                }
            });
            return obj;
        });

        return { headers, data: structuredData };
    }

    async parseWithMapping(file: File, headerMap?: HeaderMapping): Promise<any[]> {
        const result = await this.parseToJSON(file);
        if (!headerMap) return result.data;

        return result.data.map(row => {
            const mapped: any = {};
            Object.entries(headerMap).forEach(([excelHeader, targetKey]) => {
                mapped[targetKey] = row[excelHeader];
            });
            return mapped;
        });
    }
}
