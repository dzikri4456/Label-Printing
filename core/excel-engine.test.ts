import { describe, it, expect } from 'vitest';
import { sanitizeKey } from '../excel-engine';

describe('Excel Engine', () => {
    describe('sanitizeKey', () => {
        it('should convert to lowercase', () => {
            expect(sanitizeKey('Material Description')).toBe('material_description');
        });

        it('should replace spaces with underscores', () => {
            expect(sanitizeKey('Base Unit of Measure')).toBe('base_unit_of_measure');
        });

        it('should remove special characters', () => {
            expect(sanitizeKey('Material#Code!')).toBe('materialcode');
        });

        it('should trim whitespace', () => {
            expect(sanitizeKey('  Material  ')).toBe('material');
        });

        it('should handle empty strings', () => {
            expect(sanitizeKey('')).toBe('');
        });

        it('should handle multiple spaces', () => {
            expect(sanitizeKey('Material   Description')).toBe('material_description');
        });
    });
});
