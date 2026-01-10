import { useState, useCallback, useEffect } from 'react';

export interface CanvasZoomState {
    zoom: number;
    minZoom: number;
    maxZoom: number;
    canvasWidth: number;
    canvasHeight: number;
    viewportWidth: number;
    viewportHeight: number;
}

export interface CanvasZoomControls {
    zoom: number;
    zoomIn: () => void;
    zoomOut: () => void;
    setZoom: (zoom: number) => void;
    fitToView: () => void;
    resetZoom: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
}

const ZOOM_STEP = 0.1; // 10% per step
const MIN_ZOOM = 0.25; // 25%
const MAX_ZOOM = 2.0;  // 200%
const FIT_PADDING = 0.9; // 90% of viewport (10% padding)

/**
 * Custom hook for managing canvas zoom state
 * Provides zoom controls and fit-to-view calculation
 */
export const useCanvasZoom = (
    canvasWidth: number,
    canvasHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    initialZoom?: number
): CanvasZoomControls => {

    // Calculate optimal fit-to-view zoom
    const calculateFitZoom = useCallback(() => {
        if (!canvasWidth || !canvasHeight || !viewportWidth || !viewportHeight) {
            return 1;
        }

        const scaleX = (viewportWidth * FIT_PADDING) / canvasWidth;
        const scaleY = (viewportHeight * FIT_PADDING) / canvasHeight;

        // Use the smaller scale to ensure canvas fits in both dimensions
        const fitZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

        // Clamp to min/max zoom
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
    }, [canvasWidth, canvasHeight, viewportWidth, viewportHeight]);

    // Initialize zoom with fit-to-view if no initial zoom provided
    const [zoom, setZoomState] = useState<number>(() => {
        return initialZoom ?? calculateFitZoom();
    });

    // Auto fit-to-view when canvas dimensions change
    useEffect(() => {
        if (!initialZoom) {
            const fitZoom = calculateFitZoom();
            setZoomState(fitZoom);
        }
    }, [canvasWidth, canvasHeight, calculateFitZoom, initialZoom]);

    // Zoom in by ZOOM_STEP
    const zoomIn = useCallback(() => {
        setZoomState(prev => {
            const newZoom = prev + ZOOM_STEP;
            return Math.min(newZoom, MAX_ZOOM);
        });
    }, []);

    // Zoom out by ZOOM_STEP
    const zoomOut = useCallback(() => {
        setZoomState(prev => {
            const newZoom = prev - ZOOM_STEP;
            return Math.max(newZoom, MIN_ZOOM);
        });
    }, []);

    // Set specific zoom level
    const setZoom = useCallback((newZoom: number) => {
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        setZoomState(clampedZoom);
    }, []);

    // Fit canvas to viewport
    const fitToView = useCallback(() => {
        const fitZoom = calculateFitZoom();
        setZoomState(fitZoom);
    }, [calculateFitZoom]);

    // Reset to 100%
    const resetZoom = useCallback(() => {
        setZoomState(1);
    }, []);

    // Check if can zoom in/out
    const canZoomIn = zoom < MAX_ZOOM;
    const canZoomOut = zoom > MIN_ZOOM;

    return {
        zoom,
        zoomIn,
        zoomOut,
        setZoom,
        fitToView,
        resetZoom,
        canZoomIn,
        canZoomOut,
    };
};
