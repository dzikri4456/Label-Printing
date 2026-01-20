import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from './config';
import { Logger } from '../../../core/logger';

/**
 * Firestore Service
 * Provides CRUD operations for Firestore database
 */

// Generic get document
export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return null;
    }

    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as T;
        }
        return null;
    } catch (error) {
        Logger.error('Firestore getDocument error', { error, collectionName, docId });
        throw error;
    }
};

// Generic get all documents
export const getAllDocuments = async <T>(collectionName: string): Promise<T[]> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return [];
    }

    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        Logger.error('Firestore getAllDocuments error', { error, collectionName });
        throw error;
    }
};

// Generic set document
export const setDocument = async <T>(
    collectionName: string,
    docId: string,
    data: T
): Promise<void> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return;
    }

    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data as any);
        Logger.info('Firestore document set', { collectionName, docId });
    } catch (error) {
        Logger.error('Firestore setDocument error', { error, collectionName, docId });
        throw error;
    }
};

// Generic update document
export const updateDocument = async <T>(
    collectionName: string,
    docId: string,
    data: Partial<T>
): Promise<void> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return;
    }

    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, data as any);
        Logger.info('Firestore document updated', { collectionName, docId });
    } catch (error) {
        Logger.error('Firestore updateDocument error', { error, collectionName, docId });
        throw error;
    }
};

// Generic delete document
export const deleteDocument = async (
    collectionName: string,
    docId: string
): Promise<void> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return;
    }

    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        Logger.info('Firestore document deleted', { collectionName, docId });
    } catch (error) {
        Logger.error('Firestore deleteDocument error', { error, collectionName, docId });
        throw error;
    }
};

// Query documents
export const queryDocuments = async <T>(
    collectionName: string,
    conditions: { field: string; operator: any; value: any }[]
): Promise<T[]> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Firestore operation');
        return [];
    }

    try {
        const collectionRef = collection(db, collectionName);
        const constraints = conditions.map(c => where(c.field, c.operator, c.value));
        const q = query(collectionRef, ...constraints);

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        Logger.error('Firestore queryDocuments error', { error, collectionName });
        throw error;
    }
};
