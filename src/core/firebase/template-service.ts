import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { Logger } from '../../../core/logger';
import { SavedTemplate } from '../../../core/template-repository';

const COLLECTION_NAME = 'templates';

/**
 * Load all templates from Firebase
 */
export async function getAllTemplates(): Promise<SavedTemplate[]> {
    try {
        const templatesRef = collection(db, COLLECTION_NAME);
        const snapshot = await getDocs(templatesRef);

        const templates: SavedTemplate[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            templates.push({
                id: doc.id,
                name: data['name'] || 'Untitled',
                width: data['width'] || 100,
                height: data['height'] || 100,
                elements: data['elements'] || [],
                schema: data['schema'] || [],
                lastModified: data['lastModified']?.toMillis?.() || Date.now()
            });
        });

        Logger.info(`[Template Service] Loaded ${templates.length} templates from Firebase`);
        return templates.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
        Logger.error('[Template Service] Failed to load templates from Firebase', error);
        return [];
    }
}

/**
 * Save a template to Firebase
 */
export async function saveTemplateToFirebase(template: SavedTemplate): Promise<void> {
    try {
        const templatesRef = collection(db, COLLECTION_NAME);
        const templateDoc = doc(templatesRef, template.id);

        await setDoc(templateDoc, {
            name: template.name,
            width: template.width,
            height: template.height,
            elements: template.elements,
            schema: template.schema,
            lastModified: Timestamp.fromMillis(template.lastModified)
        });

        Logger.info(`[Template Service] Saved template "${template.name}" to Firebase`);
    } catch (error) {
        Logger.error(`[Template Service] Failed to save template "${template.name}"`, error);
        throw error;
    }
}

/**
 * Delete a template from Firebase
 */
export async function deleteTemplateFromFirebase(id: string): Promise<void> {
    try {
        const templateDoc = doc(db, COLLECTION_NAME, id);
        await deleteDoc(templateDoc);
        Logger.info(`[Template Service] Deleted template ${id} from Firebase`);
    } catch (error) {
        Logger.error(`[Template Service] Failed to delete template ${id}`, error);
        throw error;
    }
}

/**
 * Sync templates: Load from Firebase and update localStorage
 */
export async function syncTemplatesFromFirebase(): Promise<SavedTemplate[]> {
    try {
        const firebaseTemplates = await getAllTemplates();

        // Store in localStorage using the CORRECT key that template repository uses
        localStorage.setItem('label_templates', JSON.stringify(firebaseTemplates));

        Logger.info(`[Template Service] Synced ${firebaseTemplates.length} templates to localStorage`);
        return firebaseTemplates;
    } catch (error) {
        Logger.error('[Template Service] Failed to sync templates from Firebase', error);
        return [];
    }
}
