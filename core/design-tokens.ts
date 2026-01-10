/**
 * Design Tokens - Typography & Spacing
 * Optimized for Web/Desktop (min-width: 1024px)
 */

export const TYPOGRAPHY = {
    // Display - For major page headings
    display: {
        '2xl': '24px',  // Main page titles
        'xl': '20px',   // Section titles
    },

    // Heading - For section headers
    heading: {
        'lg': '18px',   // Card/Panel titles
        'md': '16px',   // Subsection headers
        'sm': '14px',   // Small headers
    },

    // Body - For content
    body: {
        'md': '14px',   // Primary body text
        'sm': '13px',   // Secondary text
        'xs': '12px',   // Tertiary text
    },

    // Caption - For labels and metadata
    caption: {
        'xs': '11px',   // Labels, metadata
        '2xs': '10px',  // Tiny labels
    },
} as const;

export const SPACING = {
    // Component spacing
    component: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
    },

    // Layout spacing
    layout: {
        'section': '24px',
        'panel': '16px',
        'card': '12px',
    },
} as const;

export const SIZING = {
    // Interactive elements
    button: {
        'sm': '28px',   // Small buttons
        'md': '32px',   // Default buttons
        'lg': '40px',   // Large buttons
    },

    icon: {
        'xs': '14px',
        'sm': '16px',
        'md': '20px',
        'lg': '24px',
    },
} as const;

// Utility function to get pixel value
export const px = (value: string) => value;
