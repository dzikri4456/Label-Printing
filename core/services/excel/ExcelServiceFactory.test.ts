import { describe, it, expect, vi } from 'vitest';
import { ExcelServiceFactory } from '../ExcelServiceFactory';
import type { IExcelService } from '../IExcelService';

describe('ExcelServiceFactory', () => {
    it('should return singleton instance', () => {
        const service1 = ExcelServiceFactory.getService();
        const service2 = ExcelServiceFactory.getService();

        expect(service1).toBe(service2);
    });

    it('should allow custom service injection for testing', () => {
        const mockService: IExcelService = {
            parseToJSON: vi.fn(),
            parseWithMapping: vi.fn(),
        };

        ExcelServiceFactory.setService(mockService);
        const service = ExcelServiceFactory.getService();

        expect(service).toBe(mockService);

        // Reset for other tests
        ExcelServiceFactory.reset();
    });

    it('should reset instance', () => {
        const service1 = ExcelServiceFactory.getService();
        ExcelServiceFactory.reset();
        const service2 = ExcelServiceFactory.getService();

        expect(service1).not.toBe(service2);
    });
});
