import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, userRepository } from './user-repository';
import { Department, departmentRepository } from '../departments/department-repository';

const USER_SESSION_KEY = 'pla_current_user';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  login: (user: User) => void;
  loginAsAdmin: (password: string) => boolean;
  logout: () => void;
  refreshData: () => void;
  addUser: (name: string, role: 'admin' | 'operator', deptId?: string) => void;
  deleteUser: (id: string) => void;
  addDepartment: (name: string) => void;
  deleteDepartment: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    // Restore user session first (before other initializations)
    const savedUser = localStorage.getItem(USER_SESSION_KEY);
    if (savedUser) {
      try {
        const restoredUser = JSON.parse(savedUser);
        setCurrentUser(restoredUser);
        console.log('[UserContext] Restored user session:', restoredUser.name);
      } catch (error) {
        console.error('[UserContext] Failed to restore user session:', error);
        localStorage.removeItem(USER_SESSION_KEY);
      }
    }

    departmentRepository.initialize();
    userRepository.initialize();

    // AUTO-LOAD from Firebase
    autoLoadFromFirebase().catch(err => {
      console.error('[UserContext] Failed to auto-load from Firebase:', err);
    });

    refreshData();
  }, []);

  const autoLoadFromFirebase = async () => {
    try {
      console.log('[UserContext] Auto-loading users and departments from Firebase...');

      // Dynamically import Firebase service
      const { getAllUsers, getAllDepartments } = await import('../../src/core/firebase/user-service');

      // Load departments first (users depend on departments)
      const firebaseDepartments = await getAllDepartments();
      console.log(`[UserContext] Loaded ${firebaseDepartments.length} departments from Firebase`);

      if (firebaseDepartments.length > 0) {
        // Clear and sync from Firebase directly to localStorage
        localStorage.removeItem('pla_departments');
        const deptData = firebaseDepartments.map(d => ({ id: d.id, name: d.name }));
        localStorage.setItem('pla_departments', JSON.stringify(deptData));
      }

      // Load users
      const firebaseUsers = await getAllUsers();
      console.log(`[UserContext] Loaded ${firebaseUsers.length} users from Firebase`);

      if (firebaseUsers.length > 0) {
        // Clear and sync from Firebase directly to localStorage
        localStorage.removeItem('pla_users');
        const userData = firebaseUsers.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          departmentId: u.departmentId
        }));
        localStorage.setItem('pla_users', JSON.stringify(userData));
      }

      // Refresh state with new data
      refreshData();
      console.log('[UserContext] ✅ Auto-load complete');
    } catch (error) {
      console.error('[UserContext] Auto-load failed:', error);
      // Silent failure - don't block app
    }
  };

  const refreshData = () => {
    setUsers(userRepository.getAll());
    setDepartments(departmentRepository.getAll());
  };

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    console.log('[UserContext] User session saved:', user.name);
  };

  const loginAsAdmin = (password: string): boolean => {
    // Get admin password from environment or use default
    const adminPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      const adminUser: User = {
        id: 'admin',
        name: 'IT Administrator',
        role: 'admin',
        departmentId: undefined
      };
      setCurrentUser(adminUser);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(adminUser));
      console.log('[UserContext] Admin session saved');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
    console.log('[UserContext] User session cleared');
  };

  const addUser = (name: string, role: 'admin' | 'operator', deptId?: string) => {
    userRepository.add(name, role, deptId);
    refreshData();
  };

  const deleteUser = (id: string) => {
    userRepository.delete(id);
    refreshData();
  };

  const addDepartment = (name: string) => {
    departmentRepository.add(name);
    refreshData();
  };

  const deleteDepartment = (id: string) => {
    departmentRepository.delete(id);
    refreshData();
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      users,
      departments,
      login,
      loginAsAdmin,
      logout,
      refreshData,
      addUser,
      deleteUser,
      addDepartment,
      deleteDepartment
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
