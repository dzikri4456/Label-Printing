/**
 * Barcode Font Registry
 * Manages available barcode fonts and provides font selection utilities
 */

export interface BarcodeFontInfo {
    name: string;
    family: string;
    displayName: string;
    preview: string; // Sample text to preview
    type: 'code39' | 'code128' | 'qr' | 'datamatrix' | 'custom';
    isAvailable: boolean;
}

/**
 * Built-in barcode fonts
 */
export const BUILTIN_BARCODE_FONTS: BarcodeFontInfo[] = [
    {
        name: 'LocalBarcodeFont',
        family: 'LocalBarcodeFont',
        displayName: 'Code 39 (Default)',
        preview: '*BARCODE123*',
        type: 'code39',
        isAvailable: true,
    },
    {
        name: 'LibreBarcode39',
        family: 'Libre Barcode 39',
        displayName: 'Libre Barcode 39',
        preview: '*SAMPLE*',
        type: 'code39',
        isAvailable: false, // Will be detected
    },
    {
        name: 'LibreBarcode128',
        family: 'Libre Barcode 128',
        displayName: 'Libre Barcode 128',
        preview: 'SAMPLE123',
        type: 'code128',
        isAvailable: false,
    },
];

/**
 * Detect available fonts by checking if they're loaded
 */
export const detectAvailableFonts = async (): Promise<BarcodeFontInfo[]> => {
    const availableFonts: BarcodeFontInfo[] = [];

    for (const font of BUILTIN_BARCODE_FONTS) {
        try {
            // Check if font is available using FontFace API
            const isAvailable = await checkFontAvailable(font.family);
            availableFonts.push({
                ...font,
                isAvailable,
            });
        } catch (error) {
            // Font not available, skip
            availableFonts.push({
                ...font,
                isAvailable: false,
            });
        }
    }

    return availableFonts;
};

/**
 * Check if a specific font is available
 */
const checkFontAvailable = async (fontFamily: string): Promise<boolean> => {
    if (!document.fonts) {
        // Fallback for browsers without FontFace API
        return true; // Assume available
    }

    try {
        await document.fonts.load(`12px "${fontFamily}"`);
        const available = document.fonts.check(`12px "${fontFamily}"`);
        return available;
    } catch {
        return false;
    }
};

/**
 * Scan CSS for @font-face declarations and register them
 */
export const scanAndRegisterFonts = (): BarcodeFontInfo[] => {
    const customFonts: BarcodeFontInfo[] = [];

    try {
        // Get all stylesheets
        const styleSheets = Array.from(document.styleSheets);

        styleSheets.forEach((sheet) => {
            try {
                const rules = Array.from(sheet.cssRules || []);

                rules.forEach((rule) => {
                    if (rule instanceof CSSFontFaceRule) {
                        const fontFamily = rule.style.getPropertyValue('font-family').replace(/['"]/g, '');

                        // Check if it's a barcode font (heuristic: contains 'barcode' in name)
                        if (fontFamily.toLowerCase().includes('barcode')) {
                            const existingFont = BUILTIN_BARCODE_FONTS.find(f => f.family === fontFamily);

                            if (!existingFont) {
                                customFonts.push({
                                    name: fontFamily,
                                    family: fontFamily,
                                    displayName: fontFamily,
                                    preview: '*SAMPLE*',
                                    type: 'custom',
                                    isAvailable: true,
                                });
                            }
                        }
                    }
                });
            } catch (e) {
                // CORS or other errors, skip this stylesheet
            }
        });
    } catch (error) {
        console.warn('Error scanning fonts:', error);
    }

    return customFonts;
};

/**
 * Get all available barcode fonts (built-in + custom)
 */
export const getAllBarcodeFonts = async (): Promise<BarcodeFontInfo[]> => {
    const builtinFonts = await detectAvailableFonts();
    const customFonts = scanAndRegisterFonts();

    // Combine and deduplicate
    const allFonts = [...builtinFonts, ...customFonts];
    const uniqueFonts = allFonts.filter((font, index, self) =>
        index === self.findIndex((f) => f.family === font.family)
    );

    return uniqueFonts.filter(f => f.isAvailable);
};

/**
 * React hook for barcode fonts
 */
import { useState, useEffect } from 'react';

export const useBarcodeFonts = () => {
    const [fonts, setFonts] = useState<BarcodeFontInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFonts = async () => {
            setLoading(true);
            const availableFonts = await getAllBarcodeFonts();
            setFonts(availableFonts);
            setLoading(false);
        };

        loadFonts();

        // Re-scan when fonts are loaded
        if (document.fonts) {
            document.fonts.ready.then(() => {
                loadFonts();
            });
        }
    }, []);

    const refreshFonts = async () => {
        const availableFonts = await getAllBarcodeFonts();
        setFonts(availableFonts);
    };

    return { fonts, loading, refreshFonts };
};
