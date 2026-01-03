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