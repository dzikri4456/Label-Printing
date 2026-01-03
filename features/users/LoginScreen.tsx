import React, { useState } from 'react';
import { useUser } from './UserContext';
import { User, UserPlus, X, LogIn, Trash2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, login, addUser, deleteUser } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      addUser(newUserName.trim());
      setNewUserName('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
         <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600 blur-[100px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-600 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-400">Select your operator profile to continue</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map(user => (
            <div 
              key={user.id}
              onClick={() => !isEditMode && login(user)}
              className={`relative group bg-slate-800/50 backdrop-blur border border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${!isEditMode && 'hover:-translate-y-1 hover:bg-slate-800 hover:shadow-2xl hover:shadow-indigo-500/20'}`}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold truncate max-w-[150px]">{user.name}</h3>
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{user.role}</span>
              </div>

              {isEditMode && user.role !== 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* ADD USER BUTTON */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="group bg-slate-800/30 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer"
          >
             <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-slate-700 transition-colors">
                <UserPlus className="w-6 h-6" />
             </div>
             <span className="text-slate-500 font-semibold group-hover:text-slate-300">New Profile</span>
          </button>
        </div>

        <div className="mt-12 flex justify-center">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isEditMode ? 'Done Editing' : 'Manage Profiles'}
            </button>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-white">Create Operator</h3>
                 <button onClick={() => setShowAddModal(false)}><X className="text-slate-400 hover:text-white" /></button>
              </div>
              <form onSubmit={handleCreateUser}>
                 <label className="block text-xs font-semibold text-slate-400 mb-1">Operator Name</label>
                 <input 
                   autoFocus
                   value={newUserName}
                   onChange={e => setNewUserName(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4 placeholder:text-slate-600"
                   placeholder="e.g. John Doe"
                 />
                 <button 
                   type="submit"
                   disabled={!newUserName.trim()}
                   className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                 >
                   Create Profile
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};