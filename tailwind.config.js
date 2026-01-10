/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./core/**/*.{js,ts,jsx,tsx}",
        "./features/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Custom font sizes for very compact UI (12px base for industrial app)
            fontSize: {
                'xs': ['0.625rem', { lineHeight: '0.875rem' }],    // 10px
                'sm': ['0.6875rem', { lineHeight: '1rem' }],       // 11px
                'base': ['0.75rem', { lineHeight: '1.25rem' }],    // 12px (reduced from 14px)
                'lg': ['0.875rem', { lineHeight: '1.5rem' }],      // 14px
                'xl': ['1rem', { lineHeight: '1.5rem' }],          // 16px
                '2xl': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
                '3xl': ['1.25rem', { lineHeight: '2rem' }],        // 20px
                '4xl': ['1.5rem', { lineHeight: '2.25rem' }],      // 24px
            },
            // Tighter spacing scale for compact layout
            spacing: {
                '0.5': '0.125rem',  // 2px
                '1': '0.25rem',     // 4px
                '1.5': '0.375rem',  // 6px
                '2': '0.5rem',      // 8px
                '2.5': '0.625rem',  // 10px
                '3': '0.75rem',     // 12px
                '3.5': '0.875rem',  // 14px
                '4': '1rem',        // 16px
                '5': '1.25rem',     // 20px
                '6': '1.5rem',      // 24px
                '7': '1.75rem',     // 28px
                '8': '2rem',        // 32px
                '10': '2.5rem',     // 40px
                '12': '3rem',       // 48px
            },
        },
    },
    plugins: [],
}
