import React, { useState, useEffect } from 'react';
import { SavedTemplate, templateRepository } from '../../core/template-repository';
import { Plus, Layout, Database, PenTool, Users } from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import { Logger } from '../../core/logger';
import { TemplateCard } from './components/TemplateCard';
import { TIMEOUTS } from '../../core/constants';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { useUser } from '../users/UserContext';
import { MasterDataManager } from './components/MasterDataManager';
import { UserManagerModal } from './components/UserManagerModal';

interface DashboardProps {
  onOpenDesigner: (id: string) => void;
  onOpenStation: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenDesigner, onOpenStation }) => {
  const { addToast } = useToast();
  const { currentUser } = useUser();
  
  // Data State
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'templates' | 'data'>('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<SavedTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    templateRepository.initialize();
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setTemplates(templateRepository.getAll());
    Logger.info('Dashboard', 'Templates Loaded');
  };

  const handleCreateSuccess = (newId: string) => {
    addToast("New template created", "success");
    onOpenDesigner(newId);
    setShowCreateModal(false);
  };

  const initiateDelete = (e: React.MouseEvent, template: SavedTemplate) => {
    e.stopPropagation();
    e.preventDefault();
    setTemplateToDelete(template);
  };

  const executeDelete = async () => {
    const target = templateToDelete;
    if (!target?.id) return;
    setIsDeleting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.MOCK_API_DELAY));
      templateRepository.delete(target.id);
      addToast("Template deleted successfully", "success");
      setTemplates(prev => prev.filter(t => t.id !== target.id));
      setTemplateToDelete(null);
    } catch (err: any) {
      Logger.error('[Dashboard] "Delete Failed"', err);
      addToast("Failed to delete template.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
             <p className="text-slate-500 mt-1">Manage print templates and global master data.</p>
          </div>
          <div className="flex gap-3">
             {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="bg-white text-slate-600 border border-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                >
                  <Users className="w-5 h-5" />
                  Users
                </button>
             )}
             {currentUser?.role === 'admin' && activeTab === 'templates' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  New Template
                </button>
             )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-6 border-b border-slate-200 mb-8">
            <button
                onClick={() => setActiveTab('templates')}
                className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'templates' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <PenTool className="w-4 h-4" />
                Template Studio
            </button>
            <button
                onClick={() => setActiveTab('data')}
                className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'data' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Database className="w-4 h-4" />
                Master Data
            </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'templates' ? (
            <>
                {templates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <Layout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-600">No Templates Found</h3>
                    <p className="text-slate-400 mt-2">Create your first label template to get started.</p>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {templates.map(tpl => (
                    <TemplateCard 
                        key={tpl.id}
                        template={tpl}
                        onClick={() => onOpenStation(tpl.id)} // Default click goes to station
                        onEdit={onOpenDesigner}
                        onDelete={initiateDelete}
                    />
                    ))}
                </div>
                )}
            </>
        ) : (
            <div className="max-w-4xl">
                <MasterDataManager />
            </div>
        )}

        {/* MODALS */}
        <CreateTemplateModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateSuccess={handleCreateSuccess}
        />

        <DeleteConfirmationModal 
          isOpen={!!templateToDelete}
          templateName={templateToDelete?.name}
          isDeleting={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setTemplateToDelete(null)}
        />
        
        <UserManagerModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
        />

      </div>
    </div>
  );
};