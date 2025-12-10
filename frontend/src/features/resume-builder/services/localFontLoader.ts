/**
 * Local Font Loader Service
 * Handles dynamic loading of fonts stored in the /fonts directory
 */

import { get, set } from 'idb-keyval';
import type { LocalFontFamily } from '../fonts/manifest';

const LOCAL_FONT_CACHE_PREFIX = 'resume-local-font-';

// Dynamic import map for font files
// Maps folder/filename to dynamic import function
const fontImportMap: Record<string, () => Promise<{ default: string }>> = {
    // Avenir Next
    'avenir/avenirnext-regular.ttf': () => import('../fonts/avenir/avenirnext-regular.ttf'),
    'avenir/avenirnext-italic.ttf': () => import('../fonts/avenir/avenirnext-italic.ttf'),
    'avenir/avenirnext-medium.ttf': () => import('../fonts/avenir/avenirnext-medium.ttf'),
    'avenir/avenirnext-mediumitalic.ttf': () => import('../fonts/avenir/avenirnext-mediumitalic.ttf'),
    'avenir/avenirnext-demibold.ttf': () => import('../fonts/avenir/avenirnext-demibold.ttf'),
    'avenir/avenirnext-demibolditalic.ttf': () => import('../fonts/avenir/avenirnext-demibolditalic.ttf'),
    'avenir/avenirnext-bold.ttf': () => import('../fonts/avenir/avenirnext-bold.ttf'),
    'avenir/avenirnext-bolditalic.ttf': () => import('../fonts/avenir/avenirnext-bolditalic.ttf'),
    // Calibri
    'calibri/calibri_light.ttf': () => import('../fonts/calibri/calibri_light.ttf'),
    'calibri/calibri_light_italic.ttf': () => import('../fonts/calibri/calibri_light_italic.ttf'),
    'calibri/calibri_regular.ttf': () => import('../fonts/calibri/calibri_regular.ttf'),
    'calibri/calibri_italic.ttf': () => import('../fonts/calibri/calibri_italic.ttf'),
    'calibri/calibri_bold.ttf': () => import('../fonts/calibri/calibri_bold.ttf'),
    'calibri/calibri_bold_italic.ttf': () => import('../fonts/calibri/calibri_bold_italic.ttf'),
    // Helvetica
    'helvetica/helvetica.ttf': () => import('../fonts/helvetica/helvetica.ttf'),
    'helvetica/helvetica-oblique.ttf': () => import('../fonts/helvetica/helvetica-oblique.ttf'),
    'helvetica/helvetica-bold.ttf': () => import('../fonts/helvetica/helvetica-bold.ttf'),
    'helvetica/helvetica-boldoblique.ttf': () => import('../fonts/helvetica/helvetica-boldoblique.ttf'),
    'helvetica/helvetica-black.ttf': () => import('../fonts/helvetica/helvetica-black.ttf'),
};

export const LocalFontLoaderService = {
    /**
     * Load a local font file as ArrayBuffer
     * @param config - Font family configuration from manifest
     * @param weight - Desired font weight (400, 700, etc.)
     * @param style - Font style ('normal' or 'italic')
     */
    async getLocalFontBlob(
        config: LocalFontFamily,
        weight: number,
        style: 'normal' | 'italic'
    ): Promise<ArrayBuffer> {
        const cacheKey = `${LOCAL_FONT_CACHE_PREFIX}${config.folder}-${weight}-${style}`;

        // Check cache first
        try {
            const cached = await get<ArrayBuffer>(cacheKey);
            if (cached) {
                return cached;
            }
        } catch {
            // Cache read failed, continue to load
        }

        // Find exact weight config
        let weightConfig = config.weights.find(w => w.weight === weight && w.style === style);

        // Fallback: if exact weight not found, find closest available weight
        if (!weightConfig) {
            const sameStyleWeights = config.weights.filter(w => w.style === style);
            if (sameStyleWeights.length > 0) {
                // Find closest weight
                weightConfig = sameStyleWeights.reduce((prev, curr) =>
                    Math.abs(curr.weight - weight) < Math.abs(prev.weight - weight) ? curr : prev
                );
            }
        }

        // Still not found? Try any weight with matching style
        if (!weightConfig) {
            weightConfig = config.weights.find(w => w.style === style);
        }

        if (!weightConfig) {
            throw new Error(`No font variant found for ${config.family} weight ${weight} style ${style}`);
        }

        const importPath = `${config.folder}/${weightConfig.file}`;
        const importer = fontImportMap[importPath];

        if (!importer) {
            throw new Error(`Font file not mapped: ${importPath}`);
        }

        // Dynamic import the font file (Vite will handle this)
        const fontModule = await importer();
        const fontUrl = fontModule.default;

        // Fetch the binary
        const response = await fetch(fontUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch local font: ${fontUrl}`);
        }

        const buffer = await response.arrayBuffer();

        // Cache for future use
        try {
            await set(cacheKey, buffer);
        } catch {
            // Cache write failed, continue without caching
        }

        return buffer;
    }
};

