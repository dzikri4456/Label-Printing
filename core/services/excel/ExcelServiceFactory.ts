/**
 * Excel Service Factory
 * 
 * Factory pattern for creating Excel service instances.
 * Provides a single point to change the Excel library implementation.
 */

import { IExcelService } from './IExcelService';
import { ExcelJSService } from './ExcelJSService';

export class ExcelServiceFactory {
    private static instance: IExcelService;

    /**
     * Get the Excel service instance
     * @returns IExcelService implementation
     */
    static getService(): IExcelService {
        if (!this.instance) {
            this.instance = new ExcelJSService();
        }
        return this.instance;
    }

    /**
     * Set a custom Excel service (useful for testing)
     * @param service - Custom IExcelService implementation
     */
    static setService(service: IExcelService): void {
        this.instance = service;
    }

    /**
     * Reset the service instance (useful for testing)
     */
    static reset(): void {
        this.instance = undefined as any;
    }
}
