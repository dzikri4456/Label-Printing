import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SavedTemplate, templateRepository } from '../../../core/template-repository';

interface TemplateContextType {
  activeTemplate: SavedTemplate | null;
  isDirty: boolean; 
  setActiveTemplate: (id: string) => void;
  updateActiveTemplate: (updates: Partial<SavedTemplate>) => void;
  saveCurrentTemplate: () => void;
  closeTemplate: () => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTemplate, setActiveTemplateState] = useState<SavedTemplate | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(''); // Store JSON string for deep comparison
  const [isDirty, setIsDirty] = useState(false);

  const setActiveTemplate = useCallback((id: string) => {
    const tpl = templateRepository.getById(id);
    if (tpl) {
      setActiveTemplateState(tpl);
      // Create snapshot on load for deep comparison
      setInitialSnapshot(JSON.stringify(tpl));
      setIsDirty(false); 
    } else {
      console.error(`Template with id ${id} not found`);
      setActiveTemplateState(null);
      setInitialSnapshot('');
    }
  }, []);

  const updateActiveTemplate = useCallback((updates: Partial<SavedTemplate>) => {
    setActiveTemplateState(prev => {
      if (!prev) return null;
      const newState = { ...prev, ...updates };
      
      // DEEP COMPARISON LOGIC
      // Compare the serialized new state with the initial snapshot.
      // This ensures we only flag dirty if there are actual content differences.
      const currentString = JSON.stringify(newState);
      setIsDirty(currentString !== initialSnapshot);
      
      return newState;
    });
  }, [initialSnapshot]);

  const saveCurrentTemplate = useCallback(() => {
    if (activeTemplate) {
      const saved = templateRepository.save(activeTemplate);
      // Update snapshot to the newly saved state so subsequent changes are tracked relative to this version
      setInitialSnapshot(JSON.stringify(saved));
      setActiveTemplateState(saved); // Update state to match saved version (e.g. timestamps)
      setIsDirty(false); 
    }
  }, [activeTemplate]);

  const closeTemplate = useCallback(() => {
    // PURE NAVIGATION - Logic moved to UI Layer (App.tsx)
    setActiveTemplateState(null);
    setInitialSnapshot('');
    setIsDirty(false);
  }, []);

  return (
    <TemplateContext.Provider value={{ 
      activeTemplate, 
      isDirty,
      setActiveTemplate, 
      updateActiveTemplate, 
      saveCurrentTemplate, 
      closeTemplate 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplateContext must be used within a TemplateProvider");
  }
  return context;
};