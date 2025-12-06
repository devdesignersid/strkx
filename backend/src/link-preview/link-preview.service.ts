import { Injectable } from '@nestjs/common';

export interface LinkPreviewData {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
}

@Injectable()
export class LinkPreviewService {
    // Block requests to internal/private networks to prevent SSRF
    private validateUrl(url: string): void {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block localhost and loopback
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
            throw new Error('Internal URLs not allowed');
        }

        // Block private IP ranges
        const privateRanges = [
            /^10\./,                    // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./,              // 192.168.0.0/16
            /^169\.254\./,              // Link-local
            /^0\./,                     // 0.0.0.0/8
        ];

        if (privateRanges.some(range => range.test(hostname))) {
            throw new Error('Private network URLs not allowed');
        }

        // Only allow http/https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only HTTP/HTTPS URLs allowed');
        }
    }

    async fetchPreview(url: string): Promise<LinkPreviewData> {
        try {
            // Validate URL before fetching (SSRF protection)
            this.validateUrl(url);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; StrkxBot/1.0)',
                    'Accept': 'text/html,application/xhtml+xml',
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Parse OG tags
            const title = this.extractMetaContent(html, 'og:title')
                || this.extractMetaContent(html, 'twitter:title')
                || this.extractTitle(html);

            const description = this.extractMetaContent(html, 'og:description')
                || this.extractMetaContent(html, 'twitter:description')
                || this.extractMetaContent(html, 'description');

            const image = this.extractMetaContent(html, 'og:image')
                || this.extractMetaContent(html, 'twitter:image');

            const siteName = this.extractMetaContent(html, 'og:site_name')
                || new URL(url).hostname;

            const favicon = this.extractFavicon(html, new URL(url).origin);

            return {
                url,
                title: title?.slice(0, 200) || null,
                description: description?.slice(0, 300) || null,
                image: image ? this.resolveUrl(image, new URL(url).origin) : null,
                siteName: siteName?.slice(0, 100) || null,
                favicon,
            };
        } catch (error) {
            throw error;
        }
    }

    private extractMetaContent(html: string, property: string): string | null {
        // Try property attribute
        const propertyMatch = html.match(
            new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
        );
        if (propertyMatch) return this.decodeHtmlEntities(propertyMatch[1]);

        // Try name attribute
        const nameMatch = html.match(
            new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
        );
        if (nameMatch) return this.decodeHtmlEntities(nameMatch[1]);

        // Try reversed order (content before property/name)
        const reversedPropertyMatch = html.match(
            new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i')
        );
        if (reversedPropertyMatch) return this.decodeHtmlEntities(reversedPropertyMatch[1]);

        const reversedNameMatch = html.match(
            new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i')
        );
        if (reversedNameMatch) return this.decodeHtmlEntities(reversedNameMatch[1]);

        return null;
    }

    private extractTitle(html: string): string | null {
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? this.decodeHtmlEntities(match[1].trim()) : null;
    }

    private extractFavicon(html: string, origin: string): string | null {
        // Look for icon link
        const iconMatch = html.match(
            /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i
        );
        if (iconMatch) {
            return this.resolveUrl(iconMatch[1], origin);
        }

        // Reversed order
        const reversedMatch = html.match(
            /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i
        );
        if (reversedMatch) {
            return this.resolveUrl(reversedMatch[1], origin);
        }

        // Default to favicon.ico
        return `${origin}/favicon.ico`;
    }

    private resolveUrl(url: string, origin: string): string {
        if (url.startsWith('//')) {
            return `https:${url}`;
        }
        if (url.startsWith('/')) {
            return `${origin}${url}`;
        }
        if (!url.startsWith('http')) {
            return `${origin}/${url}`;
        }
        return url;
    }

    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');
    }
}
