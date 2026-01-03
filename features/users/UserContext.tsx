import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, userRepository } from './user-repository';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (user: User) => void;
  logout: () => void;
  refreshUsers: () => void;
  addUser: (name: string) => void;
  deleteUser: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    userRepository.initialize();
    setUsers(userRepository.getAll());
  }, []);

  const refreshUsers = () => {
    setUsers(userRepository.getAll());
  };

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (name: string) => {
    userRepository.add(name);
    refreshUsers();
  };

  const deleteUser = (id: string) => {
    userRepository.delete(id);
    refreshUsers();
  };

  return (
    <UserContext.Provider value={{ currentUser, users, login, logout, refreshUsers, addUser, deleteUser }}>
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