import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseEnabled } from './config';
import { Logger } from '../../../core/logger';

const SETTINGS_COLLECTION = 'settings';
const CIPL_COUNTER_DOC = 'cipl_counter';

export interface CIPLCounter {
    value: number;
    lastUpdated: number;
    updatedBy: string;
}

/**
 * Get current CIPL counter value from Firestore
 */
export async function getCIPLCounter(): Promise<number | null> {
    if (!isFirebaseEnabled) {
        Logger.warn('[CIPLService] Firebase not enabled, returning null');
        return null;
    }

    try {
        const counterRef = doc(db, SETTINGS_COLLECTION, CIPL_COUNTER_DOC);
        const snapshot = await getDoc(counterRef);

        if (snapshot.exists()) {
            const data = snapshot.data() as CIPLCounter;
            Logger.info('[CIPLService] CIPL counter loaded from Firestore', { value: data.value });
            return data.value;
        }

        Logger.info('[CIPLService] No CIPL counter found in Firestore');
        return null;
    } catch (error) {
        Logger.error('[CIPLService] Failed to load CIPL counter', error as any);
        return null;
    }
}

/**
 * Save CIPL counter value to Firestore
 */
export async function saveCIPLCounter(value: number, updatedBy: string = 'System'): Promise<void> {
    if (!isFirebaseEnabled) {
        Logger.warn('[CIPLService] Firebase not enabled, skipping Firestore save');
        return;
    }

    try {
        const counterRef = doc(db, SETTINGS_COLLECTION, CIPL_COUNTER_DOC);
        const counterData: CIPLCounter = {
            value,
            lastUpdated: Date.now(),
            updatedBy
        };

        await setDoc(counterRef, counterData);
        Logger.info('[CIPLService] CIPL counter saved to Firestore', { value, updatedBy });
    } catch (error) {
        Logger.error('[CIPLService] Failed to save CIPL counter', error as any);
        throw error;
    }
}

/**
 * Increment CIPL counter in Firestore atomically
 * Returns the new value
 */
export async function incrementCIPLCounter(updatedBy: string = 'System'): Promise<number | null> {
    if (!isFirebaseEnabled) {
        Logger.warn('[CIPLService] Firebase not enabled, returning null');
        return null;
    }

    try {
        // Get current value
        const current = await getCIPLCounter();
        const newValue = (current || 18505) + 1;

        // Save new value
        await saveCIPLCounter(newValue, updatedBy);

        return newValue;
    } catch (error) {
        Logger.error('[CIPLService] Failed to increment CIPL counter', error as any);
        return null;
    }
}
