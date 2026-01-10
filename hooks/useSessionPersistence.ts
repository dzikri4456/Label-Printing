import { useEffect } from 'react';

const SESSION_KEY = 'app_session_state';

interface SessionState {
    viewMode: 'dashboard' | 'designer' | 'station';
    templateId: string | null;
}

/**
 * Custom hook for session persistence
 * Saves and restores app state (viewMode + templateId) on refresh
 */
export const useSessionPersistence = (
    viewMode: 'dashboard' | 'designer' | 'station',
    templateId: string | null,
    onRestore: (state: SessionState) => void
) => {
    // Save current state whenever it changes
    useEffect(() => {
        const state: SessionState = {
            viewMode,
            templateId
        };

        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save session state:', error);
        }
    }, [viewMode, templateId]);

    // Restore state on mount (once)
    useEffect(() => {
        try {
            const savedState = localStorage.getItem(SESSION_KEY);

            if (savedState) {
                const state: SessionState = JSON.parse(savedState);

                // Only restore if we have a valid saved state
                // and we're currently on dashboard (initial state)
                if (state.viewMode !== 'dashboard' && viewMode === 'dashboard') {
                    onRestore(state);
                }
            }
        } catch (error) {
            console.error('Failed to restore session state:', error);
        }
    }, []); // Empty deps = run once on mount
};

/**
 * Clear saved session (useful for logout)
 */
export const clearSession = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Failed to clear session:', error);
    }
};
