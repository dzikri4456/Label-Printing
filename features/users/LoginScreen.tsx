import React, { useState } from 'react';
import { useUser } from './UserContext';
import { User, LogIn, Briefcase, UserCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, departments, login } = useUser();
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Filter Logic:
  // 1. Only show Operators in the dropdown (Admins shouldn't use Kiosk login, but for POC we include them or filter if needed)
  // 2. If Dept is selected, filter users by Dept.
  const filteredUsers = users.filter(u => {
    if (selectedDeptId && u.departmentId !== selectedDeptId) return false;
    return true; 
  });

  const handleLogin = () => {
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      login(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
         <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600 blur-[100px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-600 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md z-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Operator Kiosk</h1>
          <p className="text-slate-400">Select your Department and Profile</p>
        </div>

        <div className="space-y-6">
          {/* 1. SELECT DEPARTMENT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Briefcase className="w-4 h-4" /> Department
            </label>
            <select 
              value={selectedDeptId}
              onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedUserId(''); }}
              className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-700/80 transition-colors"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* 2. SELECT USER */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <UserCircle className="w-4 h-4" /> Operator Name
            </label>
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-700/80 transition-colors disabled:opacity-50"
              disabled={filteredUsers.length === 0}
            >
              <option value="" disabled>Select your name...</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                </option>
              ))}
            </select>
            {filteredUsers.length === 0 && (
              <p className="text-xs text-red-400 mt-1">No operators found in this department.</p>
            )}
          </div>

          {/* 3. LOGIN BUTTON */}
          <button 
            onClick={handleLogin}
            disabled={!selectedUserId}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            <LogIn className="w-5 h-5" />
            Start Shift
          </button>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
                Authorized Personnel Only • v2.1.0 (Kiosk)
            </p>
        </div>
      </div>
    </div>
  );
};