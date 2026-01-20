import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage';
import { storage, isFirebaseEnabled } from './config';
import { Logger } from '../../../core/logger';

/**
 * Cloud Storage Service
 * Provides file upload/download operations for Firebase Cloud Storage
 */

// Upload file to Cloud Storage
export const uploadFile = async (
    path: string,
    file: File
): Promise<string> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Storage operation');
        throw new Error('Firebase not enabled');
    }

    try {
        const storageRef = ref(storage, path);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        Logger.info('File uploaded to Cloud Storage', { path, size: file.size });
        return downloadURL;
    } catch (error) {
        Logger.error('Cloud Storage upload error', { error, path });
        throw error;
    }
};

// Download file URL from Cloud Storage
export const getFileURL = async (path: string): Promise<string> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Storage operation');
        throw new Error('Firebase not enabled');
    }

    try {
        const storageRef = ref(storage, path);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        Logger.error('Cloud Storage getFileURL error', { error, path });
        throw error;
    }
};

// Delete file from Cloud Storage
export const deleteFile = async (path: string): Promise<void> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Storage operation');
        return;
    }

    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        Logger.info('File deleted from Cloud Storage', { path });
    } catch (error) {
        Logger.error('Cloud Storage delete error', { error, path });
        throw error;
    }
};

// List all files in a directory
export const listFiles = async (path: string): Promise<string[]> => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Storage operation');
        return [];
    }

    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);

        const fileNames = result.items.map(item => item.name);
        Logger.info('Files listed from Cloud Storage', { path, count: fileNames.length });
        return fileNames;
    } catch (error) {
        Logger.error('Cloud Storage listFiles error', { error, path });
        throw error;
    }
};

// Get file metadata
export const getFileMetadata = async (path: string) => {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, skipping Storage operation');
        return null;
    }

    try {
        const storageRef = ref(storage, path);
        const metadata = await getMetadata(storageRef);
        return metadata;
    } catch (error) {
        Logger.error('Cloud Storage getFileMetadata error', { error, path });
        throw error;
    }
};

// Upload MM60 Excel file (specific helper)
export const uploadMM60File = async (
    file: File
): Promise<{ url: string; path: string }> => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const path = `mm60/${timestamp}_${file.name}`;

    const url = await uploadFile(path, file);

    return { url, path };
};
