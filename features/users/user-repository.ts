import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../core/logger';
import { departmentRepository } from '../departments/department-repository';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator';
  departmentId?: string; // Link to Department
}

const STORAGE_KEY = 'pla_users';

class LocalStorageUserRepository {
  public getAll(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      Logger.error("UserRepository: Read failed", e);
      return [];
    }
  }

  public add(name: string, role: 'admin' | 'operator', departmentId?: string): User {
    const users = this.getAll();
    const newUser: User = {
      id: uuidv4(),
      name,
      role,
      departmentId
    };
    users.push(newUser);
    this.persist(users);
    return newUser;
  }

  public delete(id: string): void {
    const users = this.getAll();
    const filtered = users.filter(u => u.id !== id);
    this.persist(filtered);
  }

  public initialize(): void {
    const users = this.getAll();
    if (users.length === 0) {
      // Ensure depts exist first
      departmentRepository.initialize(); 
      const depts = departmentRepository.getAll();
      
      this.persist([
        { id: 'u_admin', name: 'IT Administrator', role: 'admin' },
        { id: 'u_op1', name: 'Budi (Prod)', role: 'operator', departmentId: depts.find(d => d.name === 'Production')?.id },
        { id: 'u_op2', name: 'Siti (WH)', role: 'operator', departmentId: depts.find(d => d.name === 'Warehouse')?.id }
      ]);
    }
  }

  private persist(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
}

export const userRepository = new LocalStorageUserRepository();