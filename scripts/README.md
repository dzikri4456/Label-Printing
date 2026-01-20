# Utility Scripts

## Clear Firestore MM60 Data

### Usage

```bash
# Run from project root
node scripts/clear-firestore-mm60.js
```

### What it does
- Deletes all documents from `mm60_metadata` collection
- Deletes all documents from `mm60_data` collection
- Shows progress indicator
- Irreversible operation!

### Prerequisites
- `.env` file with Firebase credentials
- `firebase` and `dotenv` packages installed

### After Running
1. Clear browser localStorage: `localStorage.clear()`
2. Upload fresh master data
3. Verify all fields display correctly
