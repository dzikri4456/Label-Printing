import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../core/logger';

export interface Department {
  id: string;
  name: string;
}

const STORAGE_KEY = 'pla_departments';

class LocalStorageDepartmentRepository {
  public getAll(): Department[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      Logger.error("DeptRepo: Read failed", e);
      return [];
    }
  }

  public add(name: string): Department {
    const depts = this.getAll();
    const newDept: Department = {
      id: uuidv4(),
      name
    };
    depts.push(newDept);
    this.persist(depts);
    return newDept;
  }

  public delete(id: string): void {
    const depts = this.getAll();
    const filtered = depts.filter(d => d.id !== id);
    this.persist(filtered);
  }

  public initialize(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const defaults = [
        { id: 'd_prod', name: 'Production' },
        { id: 'd_warehouse', name: 'Warehouse' },
        { id: 'd_qa', name: 'Quality Assurance' }
      ];
      this.persist(defaults);
    }
  }

  private persist(data: Department[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export const departmentRepository = new LocalStorageDepartmentRepository();