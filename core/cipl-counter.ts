/**
 * CIPL Counter Service
 * Persistent auto-incrementing counter with dual-layer backup
 * - Primary: LocalStorage
 * - Backup: IndexedDB
 * - Recovery: Automatic fallback if primary fails
 */

const STORAGE_KEY = 'cipl_counter';
const BACKUP_KEY = 'cipl_counter_backup';
const DB_NAME = 'LabelPrintingDB';
const DB_STORE = 'settings';
const DB_VERSION = 1;

class CIPLCounterService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.initDB();
    }

    /**
     * Initialize IndexedDB for backup storage
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB failed to open');
                resolve(); // Continue even if IndexedDB fails
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(DB_STORE)) {
                    db.createObjectStore(DB_STORE);
                }
            };
        });
    }

    /**
     * Get current CIPL number from storage
     */
    async getCurrentNumber(): Promise<number> {
        await this.initPromise;

        // Try LocalStorage first
        const localValue = localStorage.getItem(STORAGE_KEY);
        if (localValue) {
            const num = parseInt(localValue, 10);
            if (!isNaN(num)) {
                return num;
            }
        }

        // Try backup LocalStorage
        const backupValue = localStorage.getItem(BACKUP_KEY);
        if (backupValue) {
            const num = parseInt(backupValue, 10);
            if (!isNaN(num)) {
                // Restore to primary
                localStorage.setItem(STORAGE_KEY, backupValue);
                return num;
            }
        }

        // Try IndexedDB
        const dbValue = await this.getFromDB();
        if (dbValue !== null) {
            // Restore to LocalStorage
            localStorage.setItem(STORAGE_KEY, String(dbValue));
            localStorage.setItem(BACKUP_KEY, String(dbValue));
            return dbValue;
        }

        // Default starting number
        return 18505; // From your screenshot
    }

    /**
     * Get value from IndexedDB
     */
    private async getFromDB(): Promise<number | null> {
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const transaction = this.db!.transaction([DB_STORE], 'readonly');
                const store = transaction.objectStore(DB_STORE);
                const request = store.get(STORAGE_KEY);

                request.onsuccess = () => {
                    const value = request.result;
                    if (typeof value === 'number') {
                        resolve(value);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            } catch (error) {
                resolve(null);
            }
        });
    }

    /**
     * Save value to IndexedDB
     */
    private async saveToDB(value: number): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve) => {
            try {
                const transaction = this.db!.transaction([DB_STORE], 'readwrite');
                const store = transaction.objectStore(DB_STORE);
                store.put(value, STORAGE_KEY);

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => resolve();
            } catch (error) {
                resolve();
            }
        });
    }

    /**
     * Increment and get next CIPL number
     * This is called when printing
     */
    async getNextNumber(): Promise<number> {
        const current = await this.getCurrentNumber();
        const next = current + 1;

        // Save to all storage layers
        localStorage.setItem(STORAGE_KEY, String(next));
        localStorage.setItem(BACKUP_KEY, String(next));
        await this.saveToDB(next);

        return next;
    }

    /**
     * Set starting number (admin function)
     */
    async setStartingNumber(num: number): Promise<void> {
        if (num < 1) {
            throw new Error('Starting number must be at least 1');
        }

        const current = await this.getCurrentNumber();
        if (num <= current) {
            throw new Error(`Starting number must be greater than current number (${current})`);
        }

        // Save to all storage layers
        localStorage.setItem(STORAGE_KEY, String(num));
        localStorage.setItem(BACKUP_KEY, String(num));
        await this.saveToDB(num);
    }

    /**
     * Reset counter (admin function - use with caution!)
     */
    async resetCounter(num: number = 18505): Promise<void> {
        localStorage.setItem(STORAGE_KEY, String(num));
        localStorage.setItem(BACKUP_KEY, String(num));
        await this.saveToDB(num);
    }
}

// Singleton instance
export const ciplCounterService = new CIPLCounterService();
