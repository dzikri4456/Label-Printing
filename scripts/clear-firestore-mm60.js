/**
 * Clear MM60 Data from Firestore
 * 
 * This script deletes all documents from mm60_metadata and mm60_data collections
 * Use with caution - this is irreversible!
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load Firebase config from .env
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
    console.log(`\n🗑️  Clearing collection: ${collectionName}...`);

    try {
        const snapshot = await getDocs(collection(db, collectionName));
        const total = snapshot.size;

        if (total === 0) {
            console.log(`   ✅ Collection ${collectionName} is already empty`);
            return;
        }

        console.log(`   Found ${total} documents to delete`);

        let deleted = 0;
        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, collectionName, docSnapshot.id));
            deleted++;

            // Progress indicator
            if (deleted % 10 === 0 || deleted === total) {
                process.stdout.write(`\r   Deleting... ${deleted}/${total} (${Math.round(deleted / total * 100)}%)`);
            }
        }

        console.log(`\n   ✅ Successfully deleted ${deleted} documents from ${collectionName}`);
    } catch (error) {
        console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('  🔥 Firebase MM60 Data Cleanup Script');
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  WARNING: This will delete ALL MM60 data!');
    console.log('   - mm60_metadata (upload records)');
    console.log('   - mm60_data (data chunks)');
    console.log('\n   Press Ctrl+C to cancel...\n');

    // Wait 3 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // Clear metadata first
        await clearCollection('mm60_metadata');

        // Clear data chunks
        await clearCollection('mm60_data');

        console.log('\n═══════════════════════════════════════════');
        console.log('  ✅ Cleanup Complete!');
        console.log('═══════════════════════════════════════════');
        console.log('\n📋 Next steps:');
        console.log('   1. Go to app and clear localStorage');
        console.log('   2. Upload new master data');
        console.log('   3. Verify all fields appear\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Cleanup failed:', error);
        process.exit(1);
    }
}

main();
