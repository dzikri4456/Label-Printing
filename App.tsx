import React, { useState, useEffect } from 'react';
import { useLabelEditor } from './features/label-designer/hooks/useLabelEditor';
import { LabelCanvas } from './features/label-designer/components/LabelCanvas';
import { EditorPanel } from './features/label-designer/components/EditorPanel';
import { Printer, Eye, PenTool, Save, ArrowLeft } from 'lucide-react';
import { SchemaProvider, useSchema } from './features/label-designer/context/SchemaContext';
import { DataProvider, useData } from './features/label-designer/context/DataContext';
import { TemplateProvider, useTemplateContext } from './features/label-designer/context/TemplateContext';
import { BatchPrintModal } from './features/label-designer/components/BatchPrintModal';
import { StaticLabelRenderer } from './features/label-designer/components/StaticLabelRenderer';
import { Dashboard } from './features/dashboard/Dashboard';
import { SavedTemplate } from './core/template-repository';
import { ToastProvider, useToast } from './features/ui/ToastContext';
import { ErrorBoundary } from './features/ui/ErrorBoundary';
import { UnsavedChangesModal } from './features/ui/UnsavedChangesModal';
import { TIMEOUTS, DEFAULTS } from './core/constants';
import { Logger } from './core/logger';
import { UserProvider, useUser } from './features/users/UserContext';
import { LoginScreen } from './features/users/LoginScreen';
import { PrintStation } from './features/print-station/PrintStation';
import { useSessionPersistence, clearSession } from './hooks/useSessionPersistence';

// --- LABEL DESIGNER CONTAINER ---
const LabelDesignerContainer: React.FC<{ onViewDashboard: () => void }> = ({ onViewDashboard }) => {
  const { activeTemplate, updateActiveTemplate, saveCurrentTemplate, isDirty } = useTemplateContext();
  const { fields, replaceSchema } = useSchema();
  const { masterData } = useData();
  const { addToast } = useToast();

  if (!activeTemplate) return null;

  const {
    selectedId,
    isPreviewMode,
    updateElement,
    deleteElement,
    togglePreviewMode,
    handleElementMouseDown,
    handleResizeMouseDown,
    handleElementDoubleClick,
    handleCanvasClick,
    handleDropFromSidebar,
    getElementDisplayValue,
    gridEnabled,
    gridSize,
    snapEnabled,
    rulersEnabled,
    gridToolbarVisible,
    toggleGrid,
    toggleSnap,
    toggleRulers,
    toggleGridToolbar,
    setGridSizeValue
  } = useLabelEditor();

  useEffect(() => {
    if (activeTemplate.schema) {
      replaceSchema(activeTemplate.schema);
    }
  }, [activeTemplate.id, replaceSchema]);

  const [showPrintModal, setShowPrintModal] = useState(false);

  // PRINT STATE
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [printRange, setPrintRange] = useState({ start: 0, end: 0 });

  // UNSAVED CHANGES GUARD STATE
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);

  // 1. BROWSER LEVEL INTERCEPTOR (Refresh/Close Tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. APP LEVEL INTERCEPTOR (Back Button)
  const handleBackAttempt = () => {
    if (isDirty) {
      setShowExitModal(true);
    } else {
      onViewDashboard();
    }
  };

  // 3. EXIT STRATEGIES
  const handleDiscardAndExit = () => {
    setShowExitModal(false);
    onViewDashboard();
  };

  const handleSaveAndExit = async () => {
    setIsSavingAndExiting(true);
    try {
      const currentSchema = fields.filter(f => f.isCustom);
      updateActiveTemplate({ schema: currentSchema });

      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SAVE_DELAY));

      saveCurrentTemplate();
      addToast("Saved successfully. Exiting...", 'success');

      onViewDashboard();
    } catch (e) {
      Logger.error('Save and Exit failed', e);
      addToast("Failed to save template.", "error");
      setIsSavingAndExiting(false);
    }
  };

  // STANDARD SAVE
  const handleSave = () => {
    const currentSchema = fields.filter(f => f.isCustom);
    updateActiveTemplate({ schema: currentSchema });

    setTimeout(() => {
      saveCurrentTemplate();
      addToast("Template Saved Successfully!", 'success');
    }, 0);
  };

  const handlePrintClick = () => {
    if (isPreviewMode && masterData.length > 0) {
      setShowPrintModal(true);
    } else {
      // Set descriptive filename for PDF
      const originalTitle = document.title;
      const templateName = activeTemplate?.name || 'Label';
      document.title = `${templateName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;

      window.print();

      // Restore original title
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }
  };

  const executeBatchPrint = (start: number, end: number) => {
    setPrintRange({ start, end });
    setShowPrintModal(false);
    setIsBatchPrinting(true);

    setTimeout(() => {
      // Set descriptive filename for batch print PDF
      const originalTitle = document.title;
      const templateName = activeTemplate?.name || 'Label';
      document.title = `${templateName.replace(/[^a-z0-9]/gi, '_')}_Batch_${start}-${end}_${new Date().toISOString().split('T')[0]}`;

      window.print();

      // Restore original title after print
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);

      const afterPrint = () => {
        setIsBatchPrinting(false);
        setPrintRange({ start: 0, end: 0 });
        window.removeEventListener('afterprint', afterPrint);
      };
      window.addEventListener('afterprint', afterPrint);

      setTimeout(() => setIsBatchPrinting(false), TIMEOUTS.BATCH_PRINT_CLEANUP);
    }, TIMEOUTS.BATCH_PRINT_DELAY);
  };

  const updateTemplateProps = (updates: Partial<SavedTemplate>) => {
    updateActiveTemplate(updates);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">

      <style>
        {`
          @media print {
            @page {
              size: ${activeTemplate.width}mm ${activeTemplate.height}mm;
              margin: 0mm;
            }
            body, html { margin: 0; padding: 0; background: white; }
            /* Removed: body > * display none - was hiding all content */
            
            ${!isBatchPrinting ? `
              #label-print-area {
                display: block !important;
                position: fixed;
                top: 0; left: 0;
                width: ${activeTemplate.width}mm !important;
                height: ${activeTemplate.height}mm !important;
                z-index: 9999;
                overflow: hidden;
              }
              #label-print-area * { visibility: visible; }
            ` : ''}

            ${isBatchPrinting ? `
              #batch-print-container {
                display: block !important;
                position: absolute;
                top: 0; left: 0;
                width: 100%;
                z-index: 9999;
              }
            ` : ''}
          }
        `}
      </style>

      {/* Main Column */}
      <main className="flex-1 relative flex flex-col min-w-0">

        {/* DESIGNER NAVBAR */}
        <header className="h-16 flex items-center justify-between px-6 shadow-sm z-50 no-print shrink-0 bg-white/75 backdrop-blur-md sticky top-0 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackAttempt}
              className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors mr-1"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  className="text-lg font-bold text-slate-800 tracking-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1"
                  value={activeTemplate.name}
                  maxLength={DEFAULTS.UI.MAX_NAME_LENGTH}
                  onChange={(e) => updateActiveTemplate({ name: e.target.value })}
                />
                {isDirty && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium px-1">
                {activeTemplate.width}mm x {activeTemplate.height}mm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 ${isDirty ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
            >
              <Save className="w-4 h-4" />
              Save
            </button>

            <div className="h-6 w-px bg-slate-300/50"></div>

            {/* LEGACY "Data Source" BUTTON REMOVED HERE. Editor is now strictly design-only. */}

            <div className="bg-slate-100/50 p-1 rounded-lg flex border border-slate-200">
              <button
                onClick={() => isPreviewMode && togglePreviewMode()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!isPreviewMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <PenTool className="w-4 h-4" />
                Design
              </button>
              <button
                onClick={() => !isPreviewMode && togglePreviewMode()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isPreviewMode ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-100/50 relative">
          <LabelCanvas
            template={activeTemplate}
            selectedId={selectedId}
            isPreviewMode={isPreviewMode}
            onCanvasClick={handleCanvasClick}
            onElementMouseDown={handleElementMouseDown}
            onResizeMouseDown={handleResizeMouseDown}
            onElementDoubleClick={handleElementDoubleClick}
            onDropFromSidebar={handleDropFromSidebar}
            getElementDisplayValue={getElementDisplayValue}
            gridEnabled={gridEnabled}
            gridSize={gridSize}
            snapEnabled={snapEnabled}
            rulersEnabled={rulersEnabled}
            gridToolbarVisible={gridToolbarVisible}
            onToggleGrid={toggleGrid}
            onToggleSnap={toggleSnap}
            onToggleRulers={toggleRulers}
            onToggleGridToolbar={toggleGridToolbar}
            onGridSizeChange={setGridSizeValue}
          />
        </div>
      </main>

      <aside className="no-print h-full shrink-0">
        <EditorPanel
          template={activeTemplate}
          selectedId={selectedId}
          onUpdateTemplate={updateTemplateProps}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onPrint={handlePrintClick}
        />
      </aside>

      {/* LEGACY DataManagerModal REMOVED. Use Global Master Data in Dashboard instead. */}

      <UnsavedChangesModal
        isOpen={showExitModal}
        isSaving={isSavingAndExiting}
        onResume={() => setShowExitModal(false)}
        onDiscard={handleDiscardAndExit}
        onSaveAndExit={handleSaveAndExit}
      />

      {showPrintModal && (
        <BatchPrintModal
          totalRecords={masterData.length}
          onPrintCurrent={() => { setShowPrintModal(false); window.print(); }}
          onPrintBatch={executeBatchPrint}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {isBatchPrinting && (
        <div id="batch-print-container">
          {masterData.slice(printRange.start, printRange.end).map((row, idx) => (
            <StaticLabelRenderer
              key={idx}
              template={activeTemplate}
              row={row}
            />
          ))}
        </div>
      )}

    </div>
  );
};

// --- APP SHELL ---
const AppShell: React.FC = () => {
  const { activeTemplate, setActiveTemplate, closeTemplate } = useTemplateContext();
  const { currentUser, logout } = useUser();
  const [viewMode, setViewMode] = useState<'dashboard' | 'designer' | 'station'>('dashboard');

  useEffect(() => {
    if (!activeTemplate) {
      setViewMode('dashboard');
    }
  }, [activeTemplate]);

  // Session persistence - auto-restore last page on refresh
  useSessionPersistence(
    viewMode,
    activeTemplate?.id || null,
    (savedState) => {
      // Restore saved state
      if (savedState.templateId) {
        setActiveTemplate(savedState.templateId);
        setViewMode(savedState.viewMode);
      }
    }
  );

  // Handler for Dashboard Logic
  const handleOpenDesigner = (id: string) => {
    setActiveTemplate(id);
    setViewMode('designer');
  };

  const handleOpenStation = (id: string) => {
    setActiveTemplate(id);
    setViewMode('station');
  };

  const handleBackToDashboard = () => {
    closeTemplate();
    setViewMode('dashboard');
  };

  // Clear session on logout
  const handleLogout = () => {
    clearSession();
    logout();
  };

  // AUTH GUARD
  if (!currentUser) {
    return <LoginScreen />;
  }

  // VIEW ROUTER
  if (viewMode === 'designer' && activeTemplate) {
    return <LabelDesignerContainer onViewDashboard={handleBackToDashboard} />;
  }

  if (viewMode === 'station' && activeTemplate) {
    return <PrintStation onBack={handleBackToDashboard} />;
  }

  return (
    <Dashboard
      onOpenDesigner={handleOpenDesigner}
      onOpenStation={handleOpenStation}
      onLogout={handleLogout}
    />
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <ToastProvider>
        <DataProvider>
          <SchemaProvider>
            <TemplateProvider>
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
            </TemplateProvider>
          </SchemaProvider>
        </DataProvider>
      </ToastProvider>
    </UserProvider>
  );
};

export default App;



