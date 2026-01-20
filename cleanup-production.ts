/**
 * Firebase Production Cleanup Script
 * 
 * Script untuk membersihkan template test dari Firebase Production
 * Jalankan dengan: npx tsx cleanup-production.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Configuration dari .env
const firebaseConfig = {
    apiKey: process.env['VITE_FIREBASE_API_KEY'],
    authDomain: process.env['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: process.env['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: process.env['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: process.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: process.env['VITE_FIREBASE_APP_ID'],
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Identifikasi dan hapus template test berdasarkan kriteria:
 * - Nama mengandung "test", "demo", "sample", "integration"
 * - ID mengandung "test-", "demo-", "sample-"
 */
async function cleanupTestTemplates() {
    console.log('🧹 Memulai pembersihan template test dari production...\n');

    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);

    const testPatterns = [
        /test/i,
        /demo/i,
        /sample/i,
        /integration/i,
        /^test-/i,
        /^demo-/i,
        /^sample-/i,
        /^integration-/i,
        /\(test\)/i,
        /\(demo\)/i,
        /\(imported\)/i,
    ];

    let foundCount = 0;
    let deletedCount = 0;
    const templatesToDelete: Array<{ id: string; name: string }> = [];

    // Scan semua template
    snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const id = docSnapshot.id;
        const name = data['name'] || '';

        // Check apakah template adalah test template
        const isTestTemplate = testPatterns.some(
            (pattern) => pattern.test(id) || pattern.test(name)
        );

        if (isTestTemplate) {
            foundCount++;
            templatesToDelete.push({ id, name });
            console.log(`❌ Ditemukan test template: ${name} (ID: ${id})`);
        }
    });

    if (foundCount === 0) {
        console.log('\n✅ Tidak ada test template yang ditemukan. Database sudah bersih!');
        return;
    }

    console.log(`\n📊 Total test template ditemukan: ${foundCount}`);
    console.log('\n⚠️  PERINGATAN: Script ini akan menghapus template di atas dari production!');
    console.log('Tekan Ctrl+C untuk membatalkan, atau tunggu 5 detik untuk melanjutkan...\n');

    // Tunggu 5 detik sebelum menghapus
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Hapus test templates
    for (const template of templatesToDelete) {
        try {
            await deleteDoc(doc(db, 'templates', template.id));
            deletedCount++;
            console.log(`✅ Dihapus: ${template.name} (ID: ${template.id})`);
        } catch (error) {
            console.error(`❌ Gagal menghapus ${template.name}:`, error);
        }
    }

    console.log(`\n🎉 Pembersihan selesai!`);
    console.log(`   - Template dihapus: ${deletedCount}/${foundCount}`);
    console.log(`   - Production database sudah bersih dari test data\n`);
}

/**
 * Membersihkan MM60 test data jika ada
 */
async function cleanupTestMM60Data() {
    console.log('🧹 Memeriksa MM60 test data...\n');

    const mm60Ref = collection(db, 'mm60');
    const snapshot = await getDocs(mm60Ref);

    let deletedCount = 0;

    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        // Hapus data yang jelas dari testing (kurang dari 10 items biasanya test data)
        if (data['items'] && Array.isArray(data['items']) && data['items'].length < 5) {
            try {
                await deleteDoc(doc(db, 'mm60', docSnapshot.id));
                deletedCount++;
                console.log(`✅ Dihapus MM60 test data: ${docSnapshot.id}`);
            } catch (error) {
                console.error(`❌ Gagal menghapus MM60 data:`, error);
            }
        }
    }

    if (deletedCount === 0) {
        console.log('✅ Tidak ada MM60 test data yang perlu dihapus\n');
    } else {
        console.log(`\n✅ Dihapus ${deletedCount} MM60 test data\n`);
    }
}

// Main execution
async function main() {
    try {
        console.log('═══════════════════════════════════════════════');
        console.log('   Firebase Production Cleanup Tool');
        console.log('═══════════════════════════════════════════════\n');

        await cleanupTestTemplates();
        await cleanupTestMM60Data();

        console.log('═══════════════════════════════════════════════');
        console.log('   Cleanup Complete! ✨');
        console.log('═══════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

export { cleanupTestTemplates, cleanupTestMM60Data };
