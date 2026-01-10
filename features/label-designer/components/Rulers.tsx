import React from 'react';

interface RulersProps {
    canvasWidth: number;  // in pixels
    canvasHeight: number; // in pixels
    zoom: number;
    pxPerMm: number; // Conversion factor
}

export const Rulers: React.FC<RulersProps> = ({
    canvasWidth,
    canvasHeight,
    zoom,
    pxPerMm,
}) => {
    const rulerSize = 20; // Ruler thickness in pixels
    const majorTickInterval = pxPerMm * 10; // 10mm
    const minorTickInterval = pxPerMm * 5;  // 5mm

    // Generate horizontal ruler ticks
    const horizontalTicks = [];
    for (let x = 0; x <= canvasWidth; x += minorTickInterval) {
        const isMajor = x % majorTickInterval === 0;
        const mm = Math.round(x / pxPerMm);

        horizontalTicks.push(
            <g key={`h-${x}`}>
                <line
                    x1={x}
                    y1={isMajor ? 0 : 10}
                    x2={x}
                    y2={rulerSize}
                    stroke="#64748b"
                    strokeWidth={isMajor ? 1.5 : 0.5}
                />
                {isMajor && mm > 0 && (
                    <text
                        x={x}
                        y={8}
                        fontSize="9"
                        fill="#475569"
                        textAnchor="middle"
                        fontFamily="monospace"
                    >
                        {mm}
                    </text>
                )}
            </g>
        );
    }

    // Generate vertical ruler ticks
    const verticalTicks = [];
    for (let y = 0; y <= canvasHeight; y += minorTickInterval) {
        const isMajor = y % majorTickInterval === 0;
        const mm = Math.round(y / pxPerMm);

        verticalTicks.push(
            <g key={`v-${y}`}>
                <line
                    x1={isMajor ? 0 : 10}
                    y1={y}
                    x2={rulerSize}
                    y2={y}
                    stroke="#64748b"
                    strokeWidth={isMajor ? 1.5 : 0.5}
                />
                {isMajor && mm > 0 && (
                    <text
                        x={8}
                        y={y + 3}
                        fontSize="9"
                        fill="#475569"
                        textAnchor="middle"
                        fontFamily="monospace"
                        transform={`rotate(-90, 8, ${y})`}
                    >
                        {mm}
                    </text>
                )}
            </g>
        );
    }

    return (
        <>
            {/* Horizontal Ruler (Top) */}
            <svg
                className="absolute top-0 left-0 pointer-events-none bg-slate-100 border-b border-slate-300"
                width={canvasWidth}
                height={rulerSize}
                style={{
                    zIndex: 10,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                {horizontalTicks}
            </svg>

            {/* Vertical Ruler (Left) */}
            <svg
                className="absolute top-0 left-0 pointer-events-none bg-slate-100 border-r border-slate-300"
                width={rulerSize}
                height={canvasHeight}
                style={{
                    zIndex: 10,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                {verticalTicks}
            </svg>

            {/* Corner square */}
            <div
                className="absolute top-0 left-0 bg-slate-200 border-r border-b border-slate-300 flex items-center justify-center"
                style={{
                    width: rulerSize * zoom,
                    height: rulerSize * zoom,
                    zIndex: 11,
                }}
            >
                <span className="text-[8px] text-slate-500 font-mono">mm</span>
            </div>
        </>
    );
};
