import { describe, test, expect } from 'vitest';
import {
    getPaperSize,
    getPaperSizesByCategory,
    rotatePaperSize,
    getPrintScaleFactor,
    mmToPx,
    pxToMm,
    PRINTER_DPI,
    PAPER_SIZES
} from './constants';

describe('Paper Size Presets', () => {
    describe('getPaperSize', () => {
        test('should return A4 paper size', () => {
            const a4 = getPaperSize('A4');

            expect(a4).toBeDefined();
            expect(a4?.width).toBe(210);
            expect(a4?.height).toBe(297);
            expect(a4?.category).toBe('standard');
            expect(a4?.description).toContain('210');
        });

        test('should return F4 (Folio) paper size', () => {
            const f4 = getPaperSize('F4');

            expect(f4).toBeDefined();
            expect(f4?.width).toBe(210);
            expect(f4?.height).toBe(330);
            expect(f4?.category).toBe('standard');
        });

        test('should return label sizes', () => {
            const label = getPaperSize('LABEL_100x50');

            expect(label).toBeDefined();
            expect(label?.width).toBe(100);
            expect(label?.height).toBe(50);
            expect(label?.category).toBe('label');
        });

        test('should return undefined for non-existent size', () => {
            const result = getPaperSize('NON_EXISTENT');
            expect(result).toBeUndefined();
        });
    });

    describe('getPaperSizesByCategory', () => {
        test('should return all standard paper sizes', () => {
            const standard = getPaperSizesByCategory('standard');

            expect(standard.length).toBeGreaterThan(0);
            expect(standard.every(s => s.category === 'standard')).toBe(true);

            const names = standard.map(s => s.name);
            expect(names).toContain('A4');
            expect(names).toContain('F4 (Folio)');
            expect(names).toContain('Letter');
        });

        test('should return all label sizes', () => {
            const labels = getPaperSizesByCategory('label');

            expect(labels.length).toBe(6);
            expect(labels.every(s => s.category === 'label')).toBe(true);

            const names = labels.map(s => s.name);
            expect(names).toContain('100×50mm Label');
            expect(names).toContain('4"×6" Label');
        });

        test('should return empty array for custom category', () => {
            const custom = getPaperSizesByCategory('custom');
            expect(custom).toEqual([]);
        });
    });

    describe('rotatePaperSize', () => {
        test('should rotate A4 to landscape', () => {
            const a4 = PAPER_SIZES.A4;
            const rotated = rotatePaperSize(a4);

            expect(rotated.width).toBe(297); // Original height
            expect(rotated.height).toBe(210); // Original width
            expect(rotated.name).toContain('Landscape');
        });

        test('should preserve category when rotating', () => {
            const label = PAPER_SIZES.LABEL_100x50;
            const rotated = rotatePaperSize(label);

            expect(rotated.category).toBe(label.category);
        });
    });
});

describe('DPI Conversion Functions', () => {
    describe('mmToPx', () => {
        test('should convert 100mm to pixels for 203 DPI', () => {
            const result = mmToPx(100, PRINTER_DPI.ZEBRA_ZT510_203DPI);

            // 100mm / 25.4 * 203 = 799px
            expect(result).toBeCloseTo(799, 0);
        });

        test('should convert 50mm to pixels for 203 DPI', () => {
            const result = mmToPx(50, PRINTER_DPI.ZEBRA_ZT510_203DPI);

            // 50mm / 25.4 * 203 = 400px
            expect(result).toBeCloseTo(400, 0);
        });

        test('should handle zero values', () => {
            expect(mmToPx(0, PRINTER_DPI.ZEBRA_ZT510_203DPI)).toBe(0);
        });
    });

    describe('pxToMm', () => {
        test('should convert 800px to mm for 203 DPI', () => {
            const result = pxToMm(800, PRINTER_DPI.ZEBRA_ZT510_203DPI);

            // 800px / 203 * 25.4 = 100mm
            expect(result).toBeCloseTo(100, 1);
        });

        test('should handle zero values', () => {
            expect(pxToMm(0, PRINTER_DPI.ZEBRA_ZT510_203DPI)).toBe(0);
        });

        test('should round to 2 decimal places', () => {
            const result = pxToMm(123, PRINTER_DPI.ZEBRA_ZT510_203DPI);

            // Result should have max 2 decimal places
            const decimals = result.toString().split('.')[1]?.length || 0;
            expect(decimals).toBeLessThanOrEqual(2);
        });
    });

    describe('getPrintScaleFactor', () => {
        test('should calculate correct scale for 203 DPI', () => {
            const scale = getPrintScaleFactor(PRINTER_DPI.ZEBRA_ZT510_203DPI);

            // 96 / 203 = 0.473
            expect(scale).toBeCloseTo(0.473, 3);
        });

        test('should calculate correct scale for 300 DPI', () => {
            const scale = getPrintScaleFactor(PRINTER_DPI.ZEBRA_ZT510_300DPI);

            // 96 / 300 = 0.32
            expect(scale).toBeCloseTo(0.32, 2);
        });

        test('should use default 203 DPI when no argument', () => {
            const scale = getPrintScaleFactor();

            expect(scale).toBeCloseTo(0.473, 3);
        });
    });
});

describe('DEFAULTS Constants', () => {
    test('should have template defaults', () => {
        const { DEFAULTS } = require('./constants');

        expect(DEFAULTS.TEMPLATE.WIDTH).toBe(100);
        expect(DEFAULTS.TEMPLATE.HEIGHT).toBe(50);
    });

    test('should have element defaults', () => {
        const { DEFAULTS } = require('./constants');

        expect(DEFAULTS.ELEMENT.WIDTH).toBe(40);
        expect(DEFAULTS.ELEMENT.HEIGHT_TEXT).toBe(10);
        expect(DEFAULTS.ELEMENT.HEIGHT_BARCODE).toBe(25);
        expect(DEFAULTS.ELEMENT.FONT_SIZE).toBe(10);
    });

    test('should have print config', () => {
        const { PRINT_CONFIG } = require('./constants');

        expect(PRINT_CONFIG.BATCH_SIZE).toBe(50);
        expect(PRINT_CONFIG.WARNING_THRESHOLD).toBe(100);
    });
});
