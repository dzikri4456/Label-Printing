import React from 'react';

interface GridOverlayProps {
    width: number;  // Canvas width in pixels
    height: number; // Canvas height in pixels
    gridSize: number; // Grid size in pixels
    visible: boolean;
    color?: string;
    opacity?: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
    width,
    height,
    gridSize,
    visible,
    color = '#94a3b8',
    opacity = 0.15,
}) => {
    if (!visible) return null;

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            width={width}
            height={height}
            style={{ zIndex: 1 }}
        >
            <defs>
                <pattern
                    id="grid-pattern"
                    width={gridSize}
                    height={gridSize}
                    patternUnits="userSpaceOnUse"
                >
                    {/* Grid lines */}
                    <path
                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="0.5"
                        opacity={opacity}
                    />

                    {/* Stronger lines every 5 grids (50mm if gridSize is 10mm) */}
                    {gridSize > 0 && (
                        <path
                            d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`}
                            fill="none"
                            stroke={color}
                            strokeWidth="1"
                            opacity={opacity * 1.5}
                        />
                    )}
                </pattern>
            </defs>

            {/* Apply pattern to entire canvas */}
            <rect
                width={width}
                height={height}
                fill="url(#grid-pattern)"
            />

            {/* Origin indicator (0,0) */}
            <circle
                cx="0"
                cy="0"
                r="3"
                fill={color}
                opacity={opacity * 2}
            />
        </svg>
    );
};
