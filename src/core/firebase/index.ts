// Firebase Core
export { app, db, storage, isFirebaseEnabled } from './config';

// Firestore Operations
export {
    getDocument,
    getAllDocuments,
    setDocument,
    updateDocument,
    deleteDocument,
    queryDocuments
} from './firestore';

// Cloud Storage Operations
export {
    uploadFile,
    getFileURL,
    deleteFile,
    listFiles,
    getFileMetadata,
    uploadMM60File
} from './storage';

// MM60 Service Operations
export {
    saveMM60Metadata,
    saveMM60DataChunks,
    getLatestMM60Metadata,
    loadMM60Data,
    deleteMM60Data,
    hasMM60Data
} from './mm60-service';
export type { MM60Metadata } from './mm60-service';

// User & Department Service Operations
export {
    saveUser,
    getAllUsers,
    deleteUser,
    saveDepartment,
    getAllDepartments,
    deleteDepartment
} from './user-service';
export type { User, Department } from './user-service';

// CIPL Counter Service Operations
export {
    getCIPLCounter,
    saveCIPLCounter,
    incrementCIPLCounter
} from './cipl-service';
export type { CIPLCounter } from './cipl-service';

