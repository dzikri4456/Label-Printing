/**
 * Snap a value to the nearest grid point
 */
export const snapToGrid = (value: number, gridSize: number, enabled: boolean = true): number => {
    if (!enabled || gridSize <= 0) return value;
    return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap a position object to grid
 */
export const snapPositionToGrid = (
    x: number,
    y: number,
    gridSize: number,
    enabled: boolean = true
): { x: number; y: number } => {
    return {
        x: snapToGrid(x, gridSize, enabled),
        y: snapToGrid(y, gridSize, enabled),
    };
};

/**
 * Snap element bounds to grid (position and size)
 */
export const snapBoundsToGrid = (
    x: number,
    y: number,
    width: number,
    height: number,
    gridSize: number,
    enabled: boolean = true
): { x: number; y: number; width: number; height: number } => {
    if (!enabled || gridSize <= 0) {
        return { x, y, width, height };
    }

    return {
        x: snapToGrid(x, gridSize, true),
        y: snapToGrid(y, gridSize, true),
        width: snapToGrid(width, gridSize, true),
        height: snapToGrid(height, gridSize, true),
    };
};

/**
 * Check if two values are aligned (within threshold)
 */
export const isAligned = (value1: number, value2: number, threshold: number = 2): boolean => {
    return Math.abs(value1 - value2) <= threshold;
};

/**
 * Find alignment guides for an element relative to other elements
 */
export interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    position: number;
    label: string;
}

export const findAlignmentGuides = (
    elementX: number,
    elementY: number,
    elementWidth: number,
    elementHeight: number,
    otherElements: Array<{ x: number; y: number; width: number; height: number }>,
    threshold: number = 5
): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];

    const elementCenterX = elementX + elementWidth / 2;
    const elementCenterY = elementY + elementHeight / 2;
    const elementRight = elementX + elementWidth;
    const elementBottom = elementY + elementHeight;

    otherElements.forEach((other) => {
        const otherCenterX = other.x + other.width / 2;
        const otherCenterY = other.y + other.height / 2;
        const otherRight = other.x + other.width;
        const otherBottom = other.y + other.height;

        // Vertical alignment guides
        if (isAligned(elementX, other.x, threshold)) {
            guides.push({ type: 'vertical', position: other.x, label: 'Left' });
        }
        if (isAligned(elementCenterX, otherCenterX, threshold)) {
            guides.push({ type: 'vertical', position: otherCenterX, label: 'Center' });
        }
        if (isAligned(elementRight, otherRight, threshold)) {
            guides.push({ type: 'vertical', position: otherRight, label: 'Right' });
        }

        // Horizontal alignment guides
        if (isAligned(elementY, other.y, threshold)) {
            guides.push({ type: 'horizontal', position: other.y, label: 'Top' });
        }
        if (isAligned(elementCenterY, otherCenterY, threshold)) {
            guides.push({ type: 'horizontal', position: otherCenterY, label: 'Middle' });
        }
        if (isAligned(elementBottom, otherBottom, threshold)) {
            guides.push({ type: 'horizontal', position: otherBottom, label: 'Bottom' });
        }
    });

    // Remove duplicates
    return guides.filter((guide, index, self) =>
        index === self.findIndex((g) => g.type === guide.type && g.position === guide.position)
    );
};
