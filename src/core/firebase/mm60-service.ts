import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    orderBy,
    limit,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from './config';
import { Logger } from '../../../core/logger';

/**
 * MM60 Metadata structure
 */
export interface MM60Metadata {
    id: string;
    fileName: string;
    uploadedAt: number;
    uploadedBy: string;
    rowCount: number;
    headers: string[];
    lastModified: number;
}

/**
 * MM60 Data Chunk structure
 */
interface MM60DataChunk {
    id: string;
    metadataId: string;
    chunkIndex: number;
    data: any[];
    rowStart: number;
    rowEnd: number;
}

const CHUNK_SIZE = 1000; // Rows per chunk
const METADATA_COLLECTION = 'mm60_metadata';
const DATA_COLLECTION = 'mm60_data';

/**
 * Save MM60 metadata to Firestore
 */
export async function saveMM60Metadata(metadata: Omit<MM60Metadata, 'id'>): Promise<string> {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase is not enabled');
    }

    try {
        const metadataId = `mm60_${Date.now()}`;
        const metadataDoc = {
            ...metadata,
            id: metadataId
        };

        await setDoc(doc(db, METADATA_COLLECTION, metadataId), metadataDoc);
        Logger.info('MM60 metadata saved', { id: metadataId, rowCount: metadata.rowCount });

        return metadataId;
    } catch (error) {
        Logger.error('Failed to save MM60 metadata', error);
        throw error;
    }
}

/**
 * Save MM60 data in chunks to Firestore with progress tracking
 */
export async function saveMM60DataChunks(
    metadataId: string,
    data: any[],
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase is not enabled');
    }

    try {
        const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
        Logger.info('Saving MM60 data chunks', { metadataId, totalRows: data.length, totalChunks });

        // Save chunks individually with await to ensure they're committed
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, data.length);
            const chunkData = data.slice(start, end);

            const chunkId = `${metadataId}_chunk_${i}`;
            const chunk: MM60DataChunk = {
                id: chunkId,
                metadataId,
                chunkIndex: i,
                data: chunkData,
                rowStart: start,
                rowEnd: end - 1
            };

            // Use setDoc to ensure chunk is saved
            await setDoc(doc(db, DATA_COLLECTION, chunkId), chunk);

            // Report progress after each chunk is saved
            if (onProgress) {
                onProgress(i + 1, totalChunks);
            }

            Logger.info(`MM60 chunk ${i + 1}/${totalChunks} saved`, { chunkId, rows: chunkData.length });
        }

        Logger.info('MM60 data chunks saved successfully', { totalChunks });
    } catch (error) {
        Logger.error('Failed to save MM60 data chunks', error);
        throw error;
    }
}

/**
 * Get latest MM60 metadata
 */
export async function getLatestMM60Metadata(): Promise<MM60Metadata | null> {
    if (!isFirebaseEnabled) {
        Logger.warn('Firebase not enabled, cannot get MM60 metadata');
        return null;
    }

    try {
        const q = query(
            collection(db, METADATA_COLLECTION),
            orderBy('uploadedAt', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            Logger.info('No MM60 metadata found');
            return null;
        }

        const metadata = snapshot.docs[0]?.data() as MM60Metadata;
        if (!metadata) {
            Logger.warn('MM60 metadata document is empty');
            return null;
        }
        Logger.info('Latest MM60 metadata retrieved', { id: metadata.id, rowCount: metadata.rowCount });

        return metadata;
    } catch (error) {
        Logger.error('Failed to get latest MM60 metadata', error);
        return null;
    }
}

/**
 * Load all MM60 data chunks for a given metadata ID
 */
export async function loadMM60Data(metadataId: string): Promise<any[]> {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase is not enabled');
    }

    try {
        Logger.info('Loading MM60 data chunks', { metadataId });

        const q = query(
            collection(db, DATA_COLLECTION),
            orderBy('chunkIndex', 'asc')
        );

        const snapshot = await getDocs(q);
        const chunks: MM60DataChunk[] = [];

        snapshot.forEach((doc) => {
            const chunk = doc.data() as MM60DataChunk;
            if (chunk.metadataId === metadataId) {
                chunks.push(chunk);
            }
        });

        // Combine all chunks into single array
        const allData: any[] = [];
        chunks.forEach((chunk) => {
            allData.push(...chunk.data);
        });

        Logger.info('MM60 data loaded successfully', {
            metadataId,
            chunks: chunks.length,
            totalRows: allData.length
        });

        return allData;
    } catch (error) {
        Logger.error('Failed to load MM60 data', error);
        throw error;
    }
}

/**
 * Delete old MM60 data (metadata and chunks)
 */
export async function deleteMM60Data(metadataId: string): Promise<void> {
    if (!isFirebaseEnabled) {
        throw new Error('Firebase is not enabled');
    }

    try {
        Logger.info('Deleting old MM60 data', { metadataId });

        // Delete metadata
        await deleteDoc(doc(db, METADATA_COLLECTION, metadataId));

        // Delete all chunks
        const q = query(collection(db, DATA_COLLECTION));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let deleteCount = 0;

        snapshot.forEach((docSnapshot) => {
            const chunk = docSnapshot.data() as MM60DataChunk;
            if (chunk.metadataId === metadataId) {
                batch.delete(doc(db, DATA_COLLECTION, docSnapshot.id));
                deleteCount++;
            }
        });

        if (deleteCount > 0) {
            await batch.commit();
        }

        Logger.info('MM60 data deleted successfully', { metadataId, chunksDeleted: deleteCount });
    } catch (error) {
        Logger.error('Failed to delete MM60 data', error);
        throw error;
    }
}

/**
 * Check if MM60 data exists
 */
export async function hasMM60Data(): Promise<boolean> {
    const metadata = await getLatestMM60Metadata();
    return metadata !== null;
}
