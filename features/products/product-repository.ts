import { Logger } from '../../core/logger';

export interface Product {
  code: string;       // Maps to 'material'
  name: string;       // Maps to 'material_description'
  uom: string;        // Maps to 'base_unit_of_measure'
  plant?: string;
  category?: string;
  [key: string]: any; // Allow flexibility for extra fields
}

export interface ProductMetadata {
  filename: string;
  lastUpdated: string; // ISO String
  totalRows: number;
}

const STORAGE_KEY = 'app_products';
const META_KEY = 'app_products_meta';

class LocalStorageProductRepository {
  
  public getAll(): Product[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // DATA NORMALIZATION: Force 'code' to be a string
      return parsed.map((p: any) => ({
        ...p,
        code: String(p.code || '')
      }));

    } catch (e) {
      Logger.error("ProductRepo: Read failed", e);
      return [];
    }
  }

  public getMetadata(): ProductMetadata | null {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  public getByCode(code: string): Product | undefined {
    const products = this.getAll();
    const normalizedInput = String(code).trim().toUpperCase();
    return products.find(p => String(p.code).trim().toUpperCase() === normalizedInput);
  }

  public search(query: string): Product[] {
    const db = this.getAll();
    const cleanQuery = String(query).toLowerCase().trim();
    
    if (!cleanQuery) return [];

    const keywords = cleanQuery.split(/\s+/).filter(k => k.length > 0);

    return db.filter(item => {
      const itemCode = String(item.code || '').toLowerCase();
      const itemName = String(item.name || '').toLowerCase();
      const searchSpace = `${itemCode} ${itemName}`;

      return keywords.every(k => searchSpace.includes(k));
    }).slice(0, 10);
  }

  // --- ADMIN METHODS ---

  public initialize(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      Logger.info("ProductRepo: Initializing empty database.");
      this.persist([], null);
    }
  }

  public saveBulk(newProducts: Product[], filename: string): void {
    const meta: ProductMetadata = {
      filename: filename,
      lastUpdated: new Date().toISOString(),
      totalRows: newProducts.length
    };

    this.persist(newProducts, meta);
    Logger.info(`ProductRepo: Bulk saved ${newProducts.length} records from ${filename}.`);
  }

  public clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(META_KEY);
    Logger.info("ProductRepo: Database cleared (Keys removed).");
  }

  public count(): number {
    return this.getAll().length;
  }

  private persist(products: Product[], meta: ProductMetadata | null): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      if (meta) {
        localStorage.setItem(META_KEY, JSON.stringify(meta));
      }
    } catch (e) {
      Logger.error("ProductRepo: Persist failed (Quota Exceeded?)", e);
      throw new Error("Storage quota exceeded. Cannot save data.");
    }
  }
}

export const productRepository = new LocalStorageProductRepository();