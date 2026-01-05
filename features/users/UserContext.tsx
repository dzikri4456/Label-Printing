import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, userRepository } from './user-repository';
import { Department, departmentRepository } from '../departments/department-repository';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  login: (user: User) => void;
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
    departmentRepository.initialize();
    userRepository.initialize();
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(userRepository.getAll());
    setDepartments(departmentRepository.getAll());
  };

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
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