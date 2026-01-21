import React, { useState } from 'react';
import { useUser } from '../../users/UserContext';
import { useToast } from '../../ui/ToastContext';
import { X, Trash2, Briefcase, User, Shield } from 'lucide-react';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({ isOpen, onClose }) => {
  const { users, departments, addUser, deleteUser, addDepartment, deleteDepartment } = useUser();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'depts'>('users');

  // Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');
  const [newUserDept, setNewUserDept] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  if (!isOpen) return null;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      try {
        addUser(newUserName.trim(), newUserRole, newUserDept || undefined);
        addToast(`User "${newUserName}" added successfully`, 'success');
        setNewUserName('');
        setNewUserDept('');
      } catch (error) {
        addToast('Failed to add user', 'error');
      }
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    try {
      deleteUser(userId);
      addToast(`User "${userName}" deleted successfully`, 'success');
    } catch (error) {
      addToast('Failed to delete user', 'error');
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptName.trim()) {
      try {
        addDepartment(newDeptName.trim());
        addToast(`Department "${newDeptName}" created successfully`, 'success');
        setNewDeptName('');
      } catch (error) {
        addToast('Failed to create department', 'error');
      }
    }
  };

  const handleDeleteDept = (deptId: string, deptName: string) => {
    try {
      deleteDepartment(deptId);
      addToast(`Department "${deptName}" deleted successfully`, 'success');
    } catch (error) {
      addToast('Failed to delete department', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">User & Department Manager</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500'}`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('depts')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'depts' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500'}`}
          >
            Manage Departments
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {activeTab === 'users' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddUser} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Create New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Name (e.g. John)" className="px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="px-3 py-2 border rounded text-sm outline-none">
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={newUserDept} onChange={e => setNewUserDept(e.target.value)} className="px-3 py-2 border rounded text-sm outline-none">
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button disabled={!newUserName} type="submit" className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">Add User</button>
              </form>

              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-700">{u.name}</div>
                        <div className="text-xs text-slate-400">
                          {u.role} • {departments.find(d => d.id === u.departmentId)?.name || 'General'}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAddDept} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Create Department</h3>
                <div className="flex gap-3">
                  <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Dept Name (e.g. Warehouse)" className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button disabled={!newDeptName} type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">Add</button>
                </div>
              </form>
              <div className="space-y-2">
                {departments.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-slate-700">{d.name}</div>
                    </div>
                    <button onClick={() => handleDeleteDept(d.id, d.name)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};