import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseEnabled } from './config';
import { Logger } from '../../../core/logger';

export interface User {
    id: string;
    name: string;
    role: 'admin' | 'operator';
    departmentId: string;
    createdAt: number;
}

export interface Department {
    id: string;
    name: string;
    createdAt: number;
}

const USERS_COLLECTION = 'users';
const DEPARTMENTS_COLLECTION = 'departments';

// ==================== USER OPERATIONS ====================

export async function saveUser(user: User): Promise<void> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, skipping Firestore save');
        return;
    }

    try {
        const userRef = doc(db, USERS_COLLECTION, user.id);
        await setDoc(userRef, user);
        Logger.info('[UserService] User saved to Firestore', { userId: user.id, name: user.name });
    } catch (error) {
        Logger.error('[UserService] Failed to save user', error as any);
        throw error;
    }
}

export async function getAllUsers(): Promise<User[]> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, returning empty array');
        return [];
    }

    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const users: User[] = [];
        snapshot.forEach((doc) => {
            users.push(doc.data() as User);
        });

        Logger.info('[UserService] Users loaded from Firestore', { count: users.length });
        return users;
    } catch (error) {
        Logger.error('[UserService] Failed to load users', error as any);
        return [];
    }
}

export async function deleteUser(userId: string): Promise<void> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, skipping Firestore delete');
        return;
    }

    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await deleteDoc(userRef);
        Logger.info('[UserService] User deleted from Firestore', { userId });
    } catch (error) {
        Logger.error('[UserService] Failed to delete user', error as any);
        throw error;
    }
}

// ==================== DEPARTMENT OPERATIONS ====================

export async function saveDepartment(department: Department): Promise<void> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, skipping Firestore save');
        return;
    }

    try {
        const deptRef = doc(db, DEPARTMENTS_COLLECTION, department.id);
        await setDoc(deptRef, department);
        Logger.info('[UserService] Department saved to Firestore', { deptId: department.id, name: department.name });
    } catch (error) {
        Logger.error('[UserService] Failed to save department', error as any);
        throw error;
    }
}

export async function getAllDepartments(): Promise<Department[]> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, returning empty array');
        return [];
    }

    try {
        const deptsRef = collection(db, DEPARTMENTS_COLLECTION);
        const q = query(deptsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const departments: Department[] = [];
        snapshot.forEach((doc) => {
            departments.push(doc.data() as Department);
        });

        Logger.info('[UserService] Departments loaded from Firestore', { count: departments.length });
        return departments;
    } catch (error) {
        Logger.error('[UserService] Failed to load departments', error as any);
        return [];
    }
}

export async function deleteDepartment(deptId: string): Promise<void> {
    if (!isFirebaseEnabled) {
        Logger.warn('[UserService] Firebase not enabled, skipping Firestore delete');
        return;
    }

    try {
        const deptRef = doc(db, DEPARTMENTS_COLLECTION, deptId);
        await deleteDoc(deptRef);
        Logger.info('[UserService] Department deleted from Firestore', { deptId });
    } catch (error) {
        Logger.error('[UserService] Failed to delete department', error as any);
        throw error;
    }
}
