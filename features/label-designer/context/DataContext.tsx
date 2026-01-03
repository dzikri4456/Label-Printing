import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DataContextType {
  masterData: any[];
  headers: string[];
  selectedIndex: number;
  isLoading: boolean;
  loadData: (headers: string[], data: any[]) => void;
  setSelectedIndex: (index: number) => void;
  clearData: () => void;
  getActiveRow: () => any | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [masterData, setMasterData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = (newHeaders: string[], newData: any[]) => {
    setIsLoading(true);
    setHeaders(newHeaders);
    setMasterData(newData);
    setSelectedIndex(0);
    setIsLoading(false);
  };

  const clearData = () => {
    setMasterData([]);
    setHeaders([]);
    setSelectedIndex(0);
  };

  const getActiveRow = () => {
    if (masterData.length === 0) return null;
    return masterData[selectedIndex] || null;
  };

  return (
    <DataContext.Provider value={{
      masterData,
      headers,
      selectedIndex,
      isLoading,
      loadData,
      setSelectedIndex,
      clearData,
      getActiveRow
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};