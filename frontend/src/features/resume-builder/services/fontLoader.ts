import { get, set } from 'idb-keyval';

const FONT_CACHE_PREFIX = 'resume-font-blob-';

export const FontLoaderService = {
    /**
     * Orchestrates the fetch: Metadata -> Find Variant -> Download Binary
     * @param family Font family name
     * @param weight Font weight (400, 700, etc.)
     * @param style Font style ('normal' or 'italic')
     */
    async getFontBlob(family: string, weight: number | string = 400, style: 'normal' | 'italic' = 'normal'): Promise<ArrayBuffer> {
        const slug = family.toLowerCase().replace(/\s+/g, '-');
        const cacheKey = `${FONT_CACHE_PREFIX}${slug}-${weight}-${style}`;

        // 0. Check Cache
        try {
            const cached = await get<ArrayBuffer>(cacheKey);
            if (cached) {
                return cached;
            }
        } catch { /* Cache read failed */ }

        let buffer: ArrayBuffer | null = null;

        try {
            // 1. Try JSDelivr CDN (Faster, Predicted URL)
            const url = `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-${style}.woff`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Font file not found on CDN: ${url}`);
            }

            buffer = await response.arrayBuffer();

        } catch {
            // 2. Fallback to API if CDN prediction failed
            buffer = await this.fetchViaApiFallback(slug, weight, style);
        }

        if (buffer) {
            // Cache success
            try {
                await set(cacheKey, buffer);
            } catch { /* Cache write failed */ }
            return buffer;
        }

        throw new Error(`Failed to load font ${family} ${weight} ${style}`);
    },

    async fetchViaApiFallback(slug: string, weight: number | string, style: 'normal' | 'italic' = 'normal'): Promise<ArrayBuffer> {
        // 1. Query the Fontsource API (CORS Friendly)
        const apiRes = await fetch(`https://api.fontsource.org/v1/fonts/${slug}`);
        if (!apiRes.ok) throw new Error(`Font API lookup failed for ${slug}`);

        const data = await apiRes.json();

        // 2. Traverse the complex JSON object to find the URL
        const variant = data.variants[String(weight)];

        if (!variant || !variant[style] || !variant[style].latin) {
            throw new Error(`Weight ${weight} style ${style} not available for ${slug}`);
        }

        const url = variant[style].latin.url.woff;

        // 3. Download
        const fontRes = await fetch(url);
        return await fontRes.arrayBuffer();
    }
};

