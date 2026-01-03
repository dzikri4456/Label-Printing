import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../core/logger';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator';
  pin?: string; // Optional for future use
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

  public add(name: string, role: 'admin' | 'operator' = 'operator'): User {
    const users = this.getAll();
    const newUser: User = {
      id: uuidv4(),
      name,
      role
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
      this.persist([
        { id: 'u_admin', name: 'Administrator', role: 'admin' },
        { id: 'u_op1', name: 'Operator A', role: 'operator' },
        { id: 'u_op2', name: 'Operator B', role: 'operator' }
      ]);
    }
  }

  private persist(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
}

export const userRepository = new LocalStorageUserRepository();