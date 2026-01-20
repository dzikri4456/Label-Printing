import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { DataProvider } from './features/label-designer/context/DataContext';

// Mock localStorage for tests
export const mockLocalStorage = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

// Setup localStorage mock globally
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
    });
}

// Custom render with providers
interface AllProvidersProps {
    children: React.ReactNode;
}

// Create a proper ToastContext mock that matches the real implementation
const ToastContext = React.createContext<{ addToast: (message: string, type?: 'success' | 'error' | 'info') => void } | undefined>(undefined);

const MockToastProvider: React.FC<AllProvidersProps> = ({ children }) => {
    const addToast = vi.fn((message: string, type?: 'success' | 'error' | 'info') => {
        // Mock implementation - just record the call
        console.log(`[MockToast] ${type || 'info'}: ${message}`);
    });

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
        </ToastContext.Provider>
    );
};

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
    return (
        <MockToastProvider>
            <DataProvider>{children}</DataProvider>
        </MockToastProvider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockTemplate = (overrides = {}) => ({
    id: 'test-template-id',
    name: 'Test Template',
    width: 100,
    height: 50,
    elements: [],
    schema: [],
    lastModified: Date.now(),
    ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
    code: 'TEST001',
    name: 'Test Product',
    uom: 'PCS',
    ...overrides,
});

export const createMockExcelData = (rowCount = 5) => {
    const headers = ['Material', 'Material Description', 'Base Unit of Measure'];
    const data = Array.from({ length: rowCount }, (_, i) => ({
        Material: `MAT${String(i + 1).padStart(3, '0')}`,
        'Material Description': `Test Material ${i + 1}`,
        'Base Unit of Measure': 'PCS',
    }));
    return { headers, data };
};

// Utility to wait for async state updates
export const waitForStateUpdate = () =>
    new Promise((resolve) => setTimeout(resolve, 0));
