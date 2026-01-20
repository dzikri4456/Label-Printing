# Production Cleanup Guide

## 🧹 Membersihkan Template Test dari Production

Script ini akan menghapus semua template test dari Firebase Production database.

### Kriteria Template Test yang Akan Dihapus:

Template akan dihapus jika **nama** atau **ID** mengandung:
- "test" 
- "demo"
- "sample"
- "integration"
- "(Test)"
- "(Demo)"
- "(Imported)"
- ID yang dimulai dengan "test-", "demo-", "sample-", "integration-"

### Cara Menggunakan:

1. **Pastikan `.env` sudah benar**
   ```bash
   # Pastikan .env berisi konfigurasi production Firebase
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   # ...
   ```

2. **Install dependencies jika belum**
   ```bash
   npm install
   ```

3. **Jalankan cleanup script**
   ```bash
   npx tsx cleanup-production.ts
   ```

4. **Review daftar template yang akan dihapus**
   - Script akan menampilkan semua template test yang ditemukan
   - Anda punya 5 detik untuk membatalkan (Ctrl+C)
   - Setelah 5 detik, script akan otomatis menghapus semua template test

### ⚠️ PERINGATAN:

- **BACKUP** database Anda sebelum menjalankan script ini!
- Script ini akan **PERMANEN** menghapus data dari production
- Pastikan Anda yakin sebelum menjalankan
- Review output dengan teliti sebelum konfirmasi

### Hasil yang Diharapkan:

```
🧹 Memulai pembersihan template test dari production...

❌ Ditemukan test template: Test Template (ID: test-1)
❌ Ditemukan test template: Integration Test (ID: integration-test-1)
❌ Ditemukan test template: Demo Label (ID: demo-label)

📊 Total test template ditemukan: 3

⚠️  PERINGATAN: Script ini akan menghapus template di atas dari production!
Tekan Ctrl+C untuk membatalkan, atau tunggu 5 detik untuk melanjutkan...

✅ Dihapus: Test Template (ID: test-1)
✅ Dihapus: Integration Test (ID: integration-test-1)
✅ Dihapus: Demo Label (ID: demo-label)

🎉 Pembersihan selesai!
   - Template dihapus: 3/3
   - Production database sudah bersih dari test data
```

### Manual Cleanup (Alternative):

Jika Anda prefer cleanup manual via Firebase Console:

1. Buka Firebase Console: https://console.firebase.google.com
2. Pilih project Anda
3. Buka Firestore Database
4. Pilih collection `templates`
5. Cari dan hapus semua template dengan nama/ID test
6. Ulangi untuk collection `mm60` jika ada test data

### Verification:

Setelah cleanup, verifikasi di aplikasi:
1. Buka Dashboard
2. Pastikan tidak ada template test yang muncul
3. Hanya template production yang valid yang tersisa

---

**Dibuat**: 2026-01-19  
**Tujuan**: Membersihkan test data dari production Firebase
