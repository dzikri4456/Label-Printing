import React from 'react';

interface HighlightedTextProps {
    text: string;
    keywords: string[];
}

/**
 * Component to highlight matched keywords in search results
 * Example: "RPB16HMDX_1981X35_Blonde" with keywords ["1981", "blonde"]
 * Renders: "RPB16HMDX_**1981**X35_**Blonde**"
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, keywords }) => {
    if (keywords.length === 0) {
        return <>{text}</>;
    }

    // Create regex pattern for all keywords (case-insensitive)
    const pattern = keywords
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
        .join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    // Split text by matches
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => {
                // Check if this part matches any keyword
                const isMatch = keywords.some(k =>
                    part.toLowerCase() === k.toLowerCase()
                );

                return isMatch ? (
                    <strong key={index} className="bg-yellow-200 text-slate-900 font-bold">
                        {part}
                    </strong>
                ) : (
                    <span key={index}>{part}</span>
                );
            })}
        </>
    );
};
