# Precision Label Architect - Application Context

## Executive Summary

**Precision Label Architect** adalah aplikasi web modern untuk mendesain, mengelola, dan mencetak label secara batch dengan integrasi data master MM60 dari SAP. Aplikasi ini dibangun menggunakan **React 19**, **TypeScript**, **Firebase**, dan di-deploy ke **Firebase Hosting**.

**Target Users:**
- **Production Staff**: Menggunakan Print Station untuk print label dengan material number lookup
- **Designers**: Membuat dan mengedit template label di Label Designer
- **Admins**: Upload MM60 master data dan manage users

---

## 1. Application Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE CLOUD                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Hosting     │  │  Firestore   │  │  Storage     │         │
│  │  (Frontend)  │  │  (Database)  │  │  (Files)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    REACT SPA (CLIENT)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │  Designer    │  │ PrintStation │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           GLOBAL STATE (React Context)               │       │
│  │  • UserContext  • DataContext  • TemplateContext    │       │
│  └──────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 19 | UI rendering, component architecture |
| **Language** | TypeScript 5.8 | Type safety, developer experience |
| **Build Tool** | Vite 6 | Fast dev server, optimized production builds |
| **Styling** | TailwindCSS 3.4 | Utility-first CSS framework |
| **Backend** | Firebase | Authentication, database, storage, hosting |
| **Database** | Firestore | NoSQL cloud database for templates & MM60 data |
| **File Storage** | Firebase Storage | MM60 Excel file storage |
| **Hosting** | Firebase Hosting | CDN-backed static site hosting |
| **Barcode** | react-barcode | Barcode generation (CODE128, etc.) |
| **Excel** | ExcelJS | Excel file parsing and generation |
| **Icons** | Lucide React | Modern icon library |

---

## 2. Core Features

### 2.1 Dashboard (Landing Page)
**File**: `features/dashboard/Dashboard.tsx`

**Features:**
- **Template Management**: Create, edit, delete, duplicate label templates
- **Quick Actions**: Open Designer or Print Station for each template
- **Master Data Manager**: Upload Excel files for batch printing
- **User Management**: Admin can add/edit users and departments
- **MM60 Uploader**: Admin upload MM60 master data to Firebase

**User Flows:**
1. Login → Dashboard
2. Create new template → Opens Designer
3. Upload MM60 data → Opens MM60 Uploader modal
4. Click "Print" on template → Opens Print Station

### 2.2 Label Designer (Design Mode)
**File**: `features/label-designer/`

**Purpose**: Visual WYSIWYG editor untuk mendesain template label

**Key Features:**
- **Drag & Drop**: Drag data objects dari sidebar ke canvas
- **Element Types**:
  - Text (static atau dynamic/data-bound)
  - Barcode (with barcode fonts: BarCode39, LibreBarcode39, Codabar123, etc.)
  - Line (horizontal separator)
  - Rectangle (border/box)
  - Label/Value Pair (compact display: "Label: Value")
- **Canvas Tools**:
  - Grid overlay dengan snap-to-grid
  - Rulers (mm measurements)
  - Zoom controls
  - Dimension display
- **Design/Preview Mode Toggle**:
  - **Design Mode**: Shows data placeholders like `{{material}}` or `[Material]` for dynamic fields
  - **Preview Mode**: Shows actual data from master data (first row)
- **Properties Panel**:
  - Position (X, Y), Size (Width, Height)
  - Font selection (Regular fonts or Barcode fonts)
  - Font size, weight, alignment
  - Colors, borders, thickness
- **Template Settings**:
  - Canvas size (width x height in mm)
  - Template name
  - Save to Firebase Firestore

**Data Binding:**
- Elements can be bound to schema fields (MM60 data or system fields)
- System fields include: Operator Name, Date, Input fields (SO, Plan, No PL, Line, Remarks, QTY)
- Dynamic elements show alias in Design mode, actual value in Preview

### 2.3 Print Station (Production Print Mode)
**File**: `features/print-station/PrintStation.tsx`

**Purpose**: Simplified interface untuk staff production untuk print label dengan material lookup

**Key Features:**
- **Material Search**: Smart multi-keyword search across material codes dan names
  - Case-insensitive
  - Partial matching
  - Searches across: Material, Material Description, Short Code
- **Material Card Display**:
  - Material number, description, family, series
  - "Select & Print" button
- **Print Dialog**:
  - Input fields untuk SO, Plan, No PL, Line, Remarks, QTY
  - Barcode rendering preview
  - "Print Label" button → Trigger browser print
- **User Info**: Shows logged-in operator name and department

**Workflow:**
1. User searches material by keywords (e.g., "blonde 1981 35")
2. Click "Select & Print" on desired material
3. Fill in production data (SO, QTY, etc.)
4. Click "Print Label" → Browser print dialog

### 2.4 MM60 Master Data Management
**File**: `features/admin/MM60Uploader.tsx`

**Purpose**: Admin upload MM60 Excel data to Firestore for global access

**Process:**
1. Admin logs in → Dashboard → "Upload MM60" button
2. Drag & drop MM60 Excel file (must contain "MM60" in filename)
3. File uploaded to Firebase Storage
4. Excel parsed → 20 columns extracted:
   - Material, Material Description, Plant, Base Unit of Measure, Object Category, Width, Family, Series, Short Code, Design, Skin Type, Harmonised System Code, Harmonised System Description, Compliance Req., Glass Type, Class, Door Type, Skin Finish, Status, Thickness
5. Metadata saved to `mm60_metadata` collection
6. Data chunked (1000 rows per chunk) → saved to `mm60_data` collection
7. Success → All users can access latest MM60 data

**Firestore Schema:**
```
mm60_metadata/{metadataId}
  - id: string
  - fileName: string
  - uploadedAt: timestamp
  - uploadedBy: string
  - rowCount: number
  - headers: string[]
  - lastModified: timestamp

mm60_data/{chunkId}
  - id: string
  - metadataId: string
  - chunkIndex: number
  - data: array<object>
  - rowStart: number
  - rowEnd: number
```

### 2.5 User Management
**File**: `features/users/UserContext.tsx`, `features/dashboard/components/UserManagerModal.tsx`

**Features:**
- **Authentication**: Simple name + department selection (no password - production environment)
- **User Roles**: Admin can add/edit users
- **Departments**: Configurable department list
- **Session Persistence**: Auto-restore last view on page refresh

**Data Storage**: LocalStorage
- `users`: Array of user objects
- `departments`: Array of department names
- `currentUser`: Currently logged-in user

---

## 3. Data Flow & State Management

### 3.1 Global State (React Context)

```typescript
<UserProvider>           // User authentication & current user
  <ToastProvider>        // Toast notifications
    <DataProvider>       // Master data from MM60 (global)
      <SchemaProvider>   // Data schema/fields definition
        <TemplateProvider>  // Active template & template list
          <App />
        </TemplateProvider>
      </SchemaProvider>
    </DataProvider>
  </ToastProvider>
</UserProvider>
```

**Key Contexts:**

| Context | Purpose | Data Source |
|---------|---------|-------------|
| `UserContext` | Current user, login/logout | LocalStorage |
| `DataContext` | MM60 master data | Firestore (`mm60_metadata`, `mm60_data`) |
| `SchemaContext` | Data fields (MM60 + system fields) | `core/schema-registry.ts` |
| `TemplateContext` | Active template, template CRUD | Firestore (`templates` collection) |
| `ToastContext` | Toast messages | In-memory state |

### 3.2 Data Sources

**LocalStorage:**
- Templates (legacy, migrated to Firestore)
- Users
- Departments
- Session state (viewMode, templateId)

**Firestore Collections:**
- `templates`: Label templates
- `mm60_metadata`: MM60 upload metadata
- `mm60_data`: MM60 chunked data

**Firebase Storage:**
- `mm60/`: Uploaded MM60 Excel files

---

## 4. File Structure

```
Label-Printing/
├── core/                          # Core utilities & services
│   ├── constants.ts               # App-wide constants (DEFAULTS, TIMEOUTS)
│   ├── logger.ts                  # Logging utility
│   ├── print-utils.ts             # Print helpers (mmToPx conversion)
│   ├── schema-registry.ts         # Data schema definitions (20 MM60 fields + system fields)
│   ├── template-repository.ts     # Legacy template storage (LocalStorage)
│   ├── barcode-fonts.ts           # Barcode font registry
│   └── firebase/
│       ├── config.ts              # Firebase initialization
│       ├── mm60-service.ts        # MM60 Firestore operations
│       ├── template-service.ts    # Template Firestore operations
│       └── storage-service.ts     # Firebase Storage operations
│
├── features/                      # Feature modules
│   ├── dashboard/
│   │   ├── Dashboard.tsx          # Main dashboard component
│   │   └── components/
│   │       ├── CreateTemplateModal.tsx
│   │       ├── TemplateCard.tsx
│   │       ├── UserManagerModal.tsx
│   │       ├── MasterDataManager.tsx
│   │       └── DeleteConfirmationModal.tsx
│   │
│   ├── label-designer/
│   │   ├── context/               # Designer-specific contexts
│   │   │   ├── TemplateContext.tsx
│   │   │   ├── SchemaContext.tsx
│   │   │   └── DataContext.tsx
│   │   ├── hooks/
│   │   │   └── useLabelEditor.ts  # Main designer logic
│   │   ├── components/
│   │   │   ├── LabelCanvas.tsx    # Canvas container
│   │   │   ├── LabelElement.tsx   # Individual element renderer
│   │   │   ├── EditorPanel.tsx    # Right sidebar
│   │   │   ├── GridOverlay.tsx    # Grid system
│   │   │   ├── Rulers.tsx         # Measurement rulers
│   │   │   ├── BatchPrintModal.tsx
│   │   │   ├── StaticLabelRenderer.tsx  # Print preview
│   │   │   └── panels/
│   │   │       ├── PropertyEditor.tsx   # Element properties
│   │   │       ├── DataObjectsPanel.tsx # Draggable data fields
│   │   │       └── CanvasSettings.tsx   # Template settings
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── utils/
│   │       └── gridUtils.ts       # Grid/snap calculations
│   │
│   ├── print-station/
│   │   ├── PrintStation.tsx       # Production print interface
│   │   └── HighlightedText.tsx    # Search keyword highlighting
│   │
│   ├── admin/
│   │   ├── MM60Uploader.tsx       # MM60 upload interface
│   │   └── CIPLAdminSettings.tsx  # CIPL auto-numbering settings
│   │
│   ├── users/
│   │   ├── UserContext.tsx        # User authentication context
│   │   ├── LoginScreen.tsx        # Login UI
│   │   └── user-repository.ts     # User CRUD (LocalStorage)
│   │
│   └── ui/                        # Shared UI components
│       ├── ToastContext.tsx       # Toast notifications
│       ├── ErrorBoundary.tsx      # Error handling
│       └── UnsavedChangesModal.tsx
│
├── hooks/                         # Global hooks
│   └── useSessionPersistence.ts   # Session state persistence
│
├── public/
│   └── fonts/                     # Barcode font files
│       ├── BarCode39-Z7DZ.ttf
│       ├── LibreBarcode39-Regular.ttf
│       └── ...
│
├── scripts/                       # Maintenance scripts
│   └── clear-firestore-mm60.js    # Clear MM60 data from Firestore
│
├── App.tsx                        # Root component
├── index.tsx                      # Entry point
├── index.css                      # Global styles + barcode font declarations
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # TailwindCSS configuration
├── firebase.json                  # Firebase hosting config
├── firestore.rules                # Firestore security rules
└── package.json                   # Dependencies & scripts
```

---

## 5. Key Technical Decisions

### 5.1 Why Firebase?
- **Realtime Sync**: MM60 data updates tersedia langsung untuk semua users
- **Scalability**: Cloud-hosted, auto-scaling
- **No Backend Required**: Serverless architecture
- **Built-in Auth** (currently unused, simple name-based auth via LocalStorage)
- **CDN Hosting**: Fast global delivery

### 5.2 Why Firestore over LocalStorage for Templates?
- **Centralized**: Templates dapat diakses dari device manapun
- **Collaboration**: Multiple users dapat manage templates
- **Backup**: Data tidak hilang jika browser cache cleared
- **Migration**: Smooth migration dari LocalStorage ke Firestore (auto-sync on app load)

### 5.3 Barcode Font Strategy
**Problem**: Barcode tidak render sebagai bars di Design mode

**Solution**: Apply `fontFamily` CSS ke alias display
- Design mode: Shows `[material]` in barcode font (renders as bars)
- Preview mode: Shows actual data in barcode font (renders as scannable barcode)

**Available Fonts**:
1. BarCode39
2. BarCode39Lesbar
3. LibreBarcode39
4. Codabar123
5. Codabar123Lesbar

**Usage**: User selects "Font Barcode" in properties panel → Dropdown lists 5 barcode fonts

### 5.4 MM60 Data Chunking
**Problem**: Firestore document size limit (1MB)

**Solution**: Split data into chunks of 1000 rows each
- Metadata stored in `mm60_metadata`
- Data chunks stored in `mm60_data/{metadataId}_chunk_{index}`
- On load: Fetch all chunks → Combine into single array

---

## 6. Deployment Process

### 6.1 Local Development
```bash
npm run dev          # Start dev server at localhost:3000
```

### 6.2 Production Build & Deploy
```bash
# 1. Build production bundle
npm run build        # Output: dist/

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting

# 3. View deployed site
# https://cillabelapp.web.app (or your Firebase domain)
```

### 6.3 Deployment Checklist
- [ ] Ensure `.env` has Firebase credentials
- [ ] Run `npm run build` successfully
- [ ] Test build locally: `npm run preview`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Verify production site loads
- [ ] Test critical user flows:
  - [ ] Login
  - [ ] Open template in Designer
  - [ ] Search material in Print Station
  - [ ] Print label
  - [ ] Upload MM60 (admin)

---

## 7. User Workflows

### 7.1 Designer Workflow
```
1. Login → Dashboard
2. Click "Edit" on template → Opens Designer
3. Design Mode:
   - Drag data objects dari sidebar (e.g., "Material", "QTY")
   - Position & resize elements
   - Set barcode font jika perlu
   - Preview → Lihat preview dengan actual data
4. Save template
5. Back to Dashboard
```

### 7.2 Print Station Workflow
```
1. Login → Dashboard
2. Click "Print" on template → Opens Print Station
3. Search material (e.g., type "blonde 35")
4. Click "Select & Print" on material card
5. Fill in production data:
   - SO: Sales Order Number
   - Plan: Batch/Plan Number
   - No PL: Packing List Number
   - Line: Line Number
   - QTY: Quantity
   - Remarks: Additional notes
6. Click "Print Label" → Browser print dialog
7. Print → Physical label printed
```

### 7.3 Admin MM60 Upload Workflow
```
1. Login as Admin → Dashboard
2. Click "Upload MM60" button
3. Drag & drop MM60 Excel file (filename must contain "MM60")
4. Wait for upload progress (metadata → data chunks)
5. Success message → All users can now access latest MM60 data
6. Verify: Check Print Station search includes new materials
```

---

## 8. Firestore Data Schema

### 8.1 Templates Collection
```typescript
templates/{templateId}
  - id: string (UUID)
  - name: string
  - width: number (mm)
  - height: number (mm)
  - elements: array<LabelElementData>
  - schema: array<DataFieldDef>  // Custom fields
  - lastModified: timestamp
  - userId: string (future enhancement)
```

### 8.2 MM60 Metadata Collection
```typescript
mm60_metadata/{metadataId}
  - id: string ("mm60_{timestamp}")
  - fileName: string
  - uploadedAt: number (timestamp)
  - uploadedBy: string
  - rowCount: number
  - headers: string[] (20 columns)
  - lastModified: number (timestamp)
```

### 8.3 MM60 Data Collection
```typescript
mm60_data/{chunkId}
  - id: string ("{metadataId}_chunk_{index}")
  - metadataId: string
  - chunkIndex: number
  - data: array<object>  // Max 1000 rows
  - rowStart: number
  - rowEnd: number
```

---

## 9. Environment Variables

**File**: `.env` (local development)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Security**: Never commit `.env` to Git. Use `.env.example` as template.

---

## 10. Testing Strategy

### 10.1 Manual Testing
- **Unit Tests**: Not implemented (future enhancement)
- **Integration Tests**: Browser-based manual testing
- **E2E Tests**: Full user workflow testing

### 10.2 Browser Testing Checklist
- [ ] Template CRUD operations
- [ ] Element drag & drop in Designer
- [ ] Barcode font rendering (Design + Preview)
- [ ] MM60 data search in Print Station
- [ ] Print label workflow
- [ ] MM60 upload and data sync
- [ ] User login/logout
- [ ] Session persistence on refresh

---

## 11. Troubleshooting Guide

### 11.1 Common Issues

**Issue**: Barcode tidak render sebagai bars
- **Solution**: Ensure barcode font selected dalam properties panel
- **Root Cause**: Element using regular font (Arial) instead of barcode font

**Issue**: MM60 data tidak muncul di Print Station
- **Solution**: Check Firestore console → Verify `mm60_metadata` and `mm60_data` exist
- **Alternative**: Re-upload MM60 file dari Dashboard

**Issue**: Template tidak save
- **Solution**: Check browser console for errors
- **Root Cause**: Firestore connection issue or missing credentials

**Issue**: Print tidak trigger
- **Solution**: Ensure browser allows print, check print CSS rules
- **Root Cause**: Browser print dialog blocked or CSS issue

### 11.2 Debug Tools
- **Browser Console**: Check for JavaScript errors
- **Firestore Console**: Verify data structure
- **Firebase Storage**: Check uploaded MM60 files
- **Network Tab**: Monitor API calls to Firestore

---

## 12. Future Enhancements

### 12.1 Planned Features
- [ ] Real authentication (Firebase Auth)
- [ ] Template versioning
- [ ] Audit log for template changes
- [ ] Advanced barcode options (QR Code, EAN-13)
- [ ] Export template as PDF/PNG
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Template marketplace (share templates across organizations)
- [ ] Advanced search filters in Print Station
- [ ] Batch MM60 data validation
- [ ] Auto-update notification when new MM60 data uploaded

### 12.2 Performance Optimizations
- [ ] Lazy loading for large template lists
- [ ] Virtualized scrolling for material search
- [ ] Service Worker for offline support
- [ ] Image optimization for faster load times
- [ ] Code splitting for smaller initial bundle

---

## 13. Maintenance Procedures

### 13.1 Clear MM60 Data (Admin Task)
```bash
# Use maintenance script
node scripts/clear-firestore-mm60.js

# Manual steps (via Firebase Console):
1. Go to Firestore -> mm60_metadata
2. Delete all documents
3. Go to mm60_data
4. Delete all documents
5. Go to Storage -> mm60/
6. Delete all files
```

### 13.2 Backup Templates
```bash
# Export all templates from Firestore
# (Firestore Console -> Export)

# or use Firebase CLI:
firebase firestore:export gs://[BUCKET]/backups/templates
```

### 13.3 Monitor Usage
- **Firebase Console → Analytics**: Track user engagement
- **Firestore → Usage**: Monitor reads/writes
- **Storage → Usage**: Track file storage

---

## 14. Git Workflow

### 14.1 Branch Strategy
- `main`: Production branch (deployed to Firebase)
- `develop`: Development branch
- Feature branches: `feature/feature-name`
- Bugfix branches: `bugfix/issue-description`

### 14.2 Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

**Example**:
```bash
git commit -m "fix: apply barcode font to alias display in Design mode"
```

---

## 15. Support & Contact

For issues, questions, or feature requests:
- Create GitHub Issue
- Contact project maintainer
- Check documentation in `/docs/` folder

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-21 | Initial production release with Firebase integration |
| 0.9.0 | 2026-01-20 | Barcode font fix + 20 MM60 fields restoration |
| 0.8.0 | 2026-01-15 | Print Station enhancements |
| 0.7.0 | 2026-01-10 | MM60 Firebase sync |
| 0.6.0 | 2026-01-05 | Template migration to Firestore |

---

**Last Updated**: 2026-01-21  
**Maintainer**: IT Administrator  
**Application**: Precision Label Architect  
**License**: Proprietary
