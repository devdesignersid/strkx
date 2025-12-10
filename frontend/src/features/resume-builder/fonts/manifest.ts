/**
 * Local Font Manifest
 * Metadata registry for fonts stored locally in the /fonts directory
 */

export interface LocalFontWeight {
    weight: number;
    style: 'normal' | 'italic';
    file: string;
}

export interface LocalFontFamily {
    id: string;
    family: string;
    folder: string;
    category: 'serif' | 'sans-serif' | 'display';
    weights: LocalFontWeight[];
}

/**
 * Registry of local fonts available in the /fonts directory
 * Each entry maps to a folder containing .ttf files
 */
export const LOCAL_FONTS: LocalFontFamily[] = [
    {
        id: 'avenir-next',
        family: 'Avenir Next',
        folder: 'avenir',
        category: 'sans-serif',
        weights: [
            { weight: 400, style: 'normal', file: 'avenirnext-regular.ttf' },
            { weight: 400, style: 'italic', file: 'avenirnext-italic.ttf' },
            { weight: 500, style: 'normal', file: 'avenirnext-medium.ttf' },
            { weight: 500, style: 'italic', file: 'avenirnext-mediumitalic.ttf' },
            { weight: 600, style: 'normal', file: 'avenirnext-demibold.ttf' },
            { weight: 600, style: 'italic', file: 'avenirnext-demibolditalic.ttf' },
            { weight: 700, style: 'normal', file: 'avenirnext-bold.ttf' },
            { weight: 700, style: 'italic', file: 'avenirnext-bolditalic.ttf' },
        ]
    },
    {
        id: 'calibri',
        family: 'Calibri',
        folder: 'calibri',
        category: 'sans-serif',
        weights: [
            { weight: 300, style: 'normal', file: 'calibri_light.ttf' },
            { weight: 300, style: 'italic', file: 'calibri_light_italic.ttf' },
            { weight: 400, style: 'normal', file: 'calibri_regular.ttf' },
            { weight: 400, style: 'italic', file: 'calibri_italic.ttf' },
            { weight: 700, style: 'normal', file: 'calibri_bold.ttf' },
            { weight: 700, style: 'italic', file: 'calibri_bold_italic.ttf' },
        ]
    },
    {
        id: 'helvetica',
        family: 'Helvetica',
        folder: 'helvetica',
        category: 'sans-serif',
        weights: [
            { weight: 400, style: 'normal', file: 'helvetica.ttf' },
            { weight: 400, style: 'italic', file: 'helvetica-oblique.ttf' },
            { weight: 700, style: 'normal', file: 'helvetica-bold.ttf' },
            { weight: 700, style: 'italic', file: 'helvetica-boldoblique.ttf' },
            { weight: 900, style: 'normal', file: 'helvetica-black.ttf' },
        ]
    }
];

/**
 * Check if a font family is a local font
 */
export const isLocalFont = (family: string): boolean => {
    return LOCAL_FONTS.some(f => f.family === family);
};

/**
 * Get local font configuration by family name
 */
export const getLocalFontConfig = (family: string): LocalFontFamily | undefined => {
    return LOCAL_FONTS.find(f => f.family === family);
};
