import { LabelElementData } from '../features/label-designer/types';
import { DataFieldDef } from './schema-registry';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS, DEFAULTS } from './constants';
import { Logger } from './logger';

export interface SavedTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: LabelElementData[];
  schema: DataFieldDef[]; // Persist custom fields
  lastModified: number;
}

/**
 * REPOSITORY PATTERN INTERFACE
 * Decouples the business logic from the underlying data storage.
 * This contract allows swapping localStorage for IndexedDB, REST API, or Firebase 
 * in the future without breaking the Dashboard or Editor UI.
 */
export interface ITemplateRepository {
  getAll(): SavedTemplate[];
  getById(id: string): SavedTemplate | undefined;
  save(template: Omit<SavedTemplate, 'lastModified'>): SavedTemplate;
  delete(id: string): void;
  initialize(): void;
  exportTemplate(id: string): void;
  importTemplate(jsonString: string): SavedTemplate;
  exportAllTemplates(): void;
}

/**
 * CONCRETE IMPLEMENTATION: LOCAL STORAGE
 * Implements the ITemplateRepository using the browser's synchronous localStorage.
 */
class LocalStorageTemplateRepository implements ITemplateRepository {

  /**
   * Retrieves all templates, sorted by modification date (newest first).
   */
  public getAll(): SavedTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.sort((a: SavedTemplate, b: SavedTemplate) => b.lastModified - a.lastModified);
    } catch (e) {
      Logger.error("Repository: Failed to load templates", e);
      return [];
    }
  }

  /**
   * Finds a specific template by UUID.
   */
  public getById(id: string): SavedTemplate | undefined {
    const all = this.getAll();
    return all.find(t => t.id === id);
  }

  /**
   * Saves or Updates a template.
   * Handles timestamping automatically.
   */
  public save(template: Omit<SavedTemplate, 'lastModified'>): SavedTemplate {
    const all = this.getAll();
    const existingIndex = all.findIndex(t => t.id === template.id);

    const toSave: SavedTemplate = {
      ...template,
      lastModified: Date.now()
    };

    if (existingIndex >= 0) {
      all[existingIndex] = toSave;
    } else {
      all.push(toSave);
    }

    this.persist(all);
    return toSave;
  }

  /**
   * Removes a template by ID.
   */
  public delete(id: string): void {
    const all = this.getAll();
    const filtered = all.filter(t => t.id !== id);
    this.persist(filtered);
  }

  /**
   * Export a single template as JSON file
   */
  public exportTemplate(id: string): void {
    const template = this.getById(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/[^a-z0-9]/gi, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Logger.info('Template exported', { id, name: template.name });
  }

  /**
   * Export all templates as JSON file
   */
  public exportAllTemplates(): void {
    const templates = this.getAll();
    if (templates.length === 0) {
      throw new Error('No templates to export');
    }

    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `all_templates_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Logger.info('All templates exported', { count: templates.length });
  }

  /**
   * Import a template from JSON string
   */
  public importTemplate(jsonString: string): SavedTemplate {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate structure
      if (!parsed.name || !parsed.width || !parsed.height || !Array.isArray(parsed.elements)) {
        throw new Error('Invalid template format');
      }

      // Generate new ID to avoid conflicts
      const newTemplate: SavedTemplate = {
        ...parsed,
        id: uuidv4(),
        name: `${parsed.name} (Imported)`,
        lastModified: Date.now()
      };

      return this.save(newTemplate);
    } catch (e) {
      Logger.error('Template import failed', e);
      throw new Error('Failed to import template. Invalid JSON format.');
    }
  }

  /**
   * Seeds the storage with a demo template if empty.
   */
  public initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      Logger.info("Repository: Initializing default seeds");
      const defaultTemplate: SavedTemplate = {
        id: uuidv4(),
        name: 'Demo Shipping Label',
        width: DEFAULTS.TEMPLATE.WIDTH,
        height: 150, // Custom height for demo
        elements: [
          {
            id: 'demo_1',
            type: 'text',
            x: 5,
            y: 5,
            value: 'DEMO LABEL',
            fontSize: 14,
            fontWeight: 'bold'
          }
        ],
        schema: [],
        lastModified: Date.now()
      };
      this.persist([defaultTemplate]);
    }
  }

  /**
   * Internal helper to write to storage.
   */
  private persist(templates: SavedTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      Logger.error("Repository: Write failed (Storage Full?)", e);
      throw new Error("Failed to save data. LocalStorage might be full.");
    }
  }
}

// Export as a Singleton Instance to maintain state consistency across imports
export const templateRepository = new LocalStorageTemplateRepository();