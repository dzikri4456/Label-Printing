import React, { useState, useEffect } from 'react';
import { SavedTemplate, templateRepository } from '../../core/template-repository';
import { Plus, Layout, Database, PenTool, Users, Download, Upload, Settings, LogOut } from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import { Logger } from '../../core/logger';
import { TemplateCard } from './components/TemplateCard';
import { TIMEOUTS } from '../../core/constants';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { useUser } from '../users/UserContext';
import { MasterDataManager } from './components/MasterDataManager';
import { UserManagerModal } from './components/UserManagerModal';
import { getLatestMM60Metadata, loadMM60Data } from '../../src/core/firebase/mm60-service';
import { productRepository } from '../products/product-repository';
import { CIPLAdminSettings } from '../admin/CIPLAdminSettings';
import { syncTemplatesFromFirebase } from '../../src/core/firebase/template-service';

interface DashboardProps {
  onOpenDesigner: (id: string) => void;
  onOpenStation: (id: string) => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenDesigner, onOpenStation, onLogout }) => {
  const { addToast } = useToast();
  const { currentUser } = useUser();

  // Data State
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'templates' | 'data' | 'admin'>('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<SavedTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    templateRepository.initialize();
    productRepository.initialize();
    loadTemplates();
    autoLoadMM60DataFromFirebase(); // AUTO-LOAD FROM FIREBASE
    autoLoadTemplatesFromFirebase(); // AUTO-LOAD TEMPLATES FROM FIREBASE
  }, []);

  const autoLoadMM60DataFromFirebase = async () => {
    try {
      // Check if localStorage already has data
      if (productRepository.count() > 0) {
        Logger.info('[Dashboard] MM60 data already in localStorage, skipping auto-load');
        return;
      }

      Logger.info('[Dashboard] Auto-loading MM60 data from Firebase...');
      const metadata = await getLatestMM60Metadata();

      if (!metadata) {
        Logger.info('[Dashboard] No MM60 data found in Firebase');
        return;
      }

      const data = await loadMM60Data(metadata.id);

      if (data.length > 0) {
        // Map Firebase data to Product format
        const products = data.map((row: any) => ({
          code: row.material || row['Material Number'] || '',
          name: row.material_description || row['Material Description'] || '',
          uom: row.base_unit_of_measure || row['Base Unit of Measure'] || '',
          ...row
        }));

        productRepository.saveBulk(products, metadata.fileName);
        Logger.info(`[Dashboard] Auto-loaded ${products.length} products from Firebase`);
      }
    } catch (error) {
      Logger.error('[Dashboard] Failed to auto-load MM60 data', error);
      // Don't show toast - silent failure is OK
    }
  };

  const autoLoadTemplatesFromFirebase = async () => {
    try {
      Logger.info('[Dashboard] Auto-loading templates from Firebase...');
      const firebaseTemplates = await syncTemplatesFromFirebase();
      setTemplates(firebaseTemplates);
      Logger.info(`[Dashboard] Loaded ${firebaseTemplates.length} templates from Firebase`);
    } catch (error) {
      Logger.error('[Dashboard] Failed to auto-load templates from Firebase', error);
      // Fallback to localStorage
      loadTemplates();
    }
  };

  const loadTemplates = () => {
    setTemplates(templateRepository.getAll());
    Logger.info('Dashboard', { message: 'Templates Loaded' });
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
      Logger.error('[Dashboard] "Delete Failed"', { error: err });
      addToast("Failed to delete template.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      templateRepository.exportTemplate(id);
      addToast("Template exported successfully", "success");
    } catch (err: any) {
      Logger.error('[Dashboard] Export Failed', { error: err });
      addToast(err.message || "Failed to export template", "error");
    }
  };

  const handleExportAll = () => {
    try {
      templateRepository.exportAllTemplates();
      addToast(`Exported ${templates.length} templates`, "success");
    } catch (err: any) {
      Logger.error('[Dashboard] Export All Failed', { error: err });
      addToast(err.message || "Failed to export templates", "error");
    }
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = templateRepository.importTemplate(text);

        // Sync to Firebase
        try {
          const { saveTemplateToFirebase } = await import('../../src/core/firebase/template-service');
          await saveTemplateToFirebase(imported);
          Logger.info(`[Dashboard] Synced imported template "${imported.name}" to Firebase`);
        } catch (fbError) {
          Logger.error('[Dashboard] Failed to sync imported template to Firebase', fbError);
        }

        addToast(`Template "${imported.name}" imported successfully`, "success");
        loadTemplates();
      } catch (err: any) {
        Logger.error('[Dashboard] Import Failed', { error: err });
        addToast(err.message || "Failed to import template", "error");
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Template Studio'}
            </h1>
            <p className="text-slate-500 mt-1">Manage print templates and global master data.</p>
          </div>
          <div className="flex items-center gap-3">
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
              <>
                <button
                  onClick={handleImportTemplate}
                  className="bg-white text-slate-600 border border-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Import
                </button>
                {templates.length > 0 && (
                  <button
                    onClick={handleExportAll}
                    className="bg-white text-slate-600 border border-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Export All
                  </button>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  New Template
                </button>
              </>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-auto bg-white text-slate-600 border border-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout ({currentUser?.name})
              </button>
            )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-6 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            <PenTool className="w-4 h-4" />
            Template Studio
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('data')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'data'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Database className="w-4 h-4" />
              Master Data
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'admin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Settings className="w-4 h-4" />
              Admin Settings
            </button>
          )}
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'templates' ? (
          <>
            {templates.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Layout className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600">No Templates Found</h3>
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
                    onExport={handleExportTemplate}
                  />
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'admin' ? (
          <div className="max-w-2xl mx-auto">
            <CIPLAdminSettings />
          </div>
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
