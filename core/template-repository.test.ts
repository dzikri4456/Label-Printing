import { describe, test, expect, beforeEach } from 'vitest';
import { templateRepository, SavedTemplate } from './template-repository';
import { v4 as uuidv4 } from 'uuid';

describe('TemplateRepository', () => {
    beforeEach(() => {
        localStorage.clear();
        templateRepository.initialize();
    });

    describe('CRUD Operations', () => {
        test('should create new template with valid data', () => {
            const template = {
                id: uuidv4(),
                name: 'Test Label',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            const saved = templateRepository.save(template);

            expect(saved.id).toBe(template.id);
            expect(saved.name).toBe('Test Label');
            expect(saved.width).toBe(100);
            expect(saved.height).toBe(50);
            expect(saved.lastModified).toBeDefined();
            expect(typeof saved.lastModified).toBe('number');
        });

        test('should auto-generate timestamp on save', () => {
            const before = Date.now();
            const template = {
                id: uuidv4(),
                name: 'Timestamp Test',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            const saved = templateRepository.save(template);
            const after = Date.now();

            expect(saved.lastModified).toBeGreaterThanOrEqual(before);
            expect(saved.lastModified).toBeLessThanOrEqual(after);
        });

        test('should retrieve template by ID', () => {
            const id = uuidv4();
            const template = {
                id,
                name: 'Retrieve Test',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            templateRepository.save(template);
            const retrieved = templateRepository.getById(id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(id);
            expect(retrieved?.name).toBe('Retrieve Test');
        });

        test('should return undefined for non-existent ID', () => {
            const result = templateRepository.getById('non-existent-id');
            expect(result).toBeUndefined();
        });

        test('should delete template', () => {
            const id = uuidv4();
            const template = {
                id,
                name: 'Delete Test',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            templateRepository.save(template);
            expect(templateRepository.getById(id)).toBeDefined();

            templateRepository.delete(id);
            expect(templateRepository.getById(id)).toBeUndefined();
        });

        test('should get all templates sorted by lastModified', async () => {
            const template1 = {
                id: uuidv4(),
                name: 'First',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            const template2 = {
                id: uuidv4(),
                name: 'Second',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            templateRepository.save(template1);
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
            templateRepository.save(template2);

            const all = templateRepository.getAll();

            expect(all.length).toBeGreaterThanOrEqual(2);
            expect(all[0].name).toBe('Second'); // Newest first
            expect(all[1].name).toBe('First');
        });
    });

    describe('Export/Import', () => {
        test('should import template from valid JSON', () => {
            const jsonData = JSON.stringify({
                id: 'old-id-123',
                name: 'Imported Label',
                width: 100,
                height: 50,
                elements: [
                    {
                        id: 'elem1',
                        type: 'text',
                        x: 10,
                        y: 10,
                        value: 'Test',
                        fontSize: 12
                    }
                ],
                schema: []
            });

            const imported = templateRepository.importTemplate(jsonData);

            expect(imported.id).not.toBe('old-id-123'); // New ID generated
            expect(imported.name).toBe('Imported Label (Imported)');
            expect(imported.width).toBe(100);
            expect(imported.height).toBe(50);
            expect(imported.elements.length).toBe(1);
            expect(imported.lastModified).toBeDefined();
        });

        test('should reject invalid JSON format', () => {
            const invalidJson = '{ invalid json }';

            expect(() => {
                templateRepository.importTemplate(invalidJson);
            }).toThrow();
        });

        test('should reject JSON without required fields', () => {
            const invalidTemplate = JSON.stringify({
                id: 'test',
                name: 'Test'
                // Missing width, height, elements
            });

            expect(() => {
                templateRepository.importTemplate(invalidTemplate);
            }).toThrow('Invalid template format');
        });

        test('should handle import with empty elements array', () => {
            const jsonData = JSON.stringify({
                id: 'test-id',
                name: 'Empty Template',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            });

            const imported = templateRepository.importTemplate(jsonData);

            expect(imported.elements).toEqual([]);
            expect(imported.schema).toEqual([]);
        });
    });

    describe('Update Operations', () => {
        test('should update existing template', () => {
            const id = uuidv4();
            const original = {
                id,
                name: 'Original Name',
                width: 100,
                height: 50,
                elements: [],
                schema: []
            };

            const saved = templateRepository.save(original);
            const originalTimestamp = saved.lastModified;

            // Wait a bit to ensure timestamp changes
            const updated = {
                ...original,
                name: 'Updated Name',
                width: 150
            };

            const savedUpdated = templateRepository.save(updated);

            expect(savedUpdated.id).toBe(id);
            expect(savedUpdated.name).toBe('Updated Name');
            expect(savedUpdated.width).toBe(150);
            expect(savedUpdated.lastModified).toBeGreaterThanOrEqual(originalTimestamp);
        });
    });
});
