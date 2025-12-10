import { useState, useEffect, useCallback } from 'react';
import { Font } from '@react-pdf/renderer';
import { FontLoaderService } from '../services/fontLoader';
import { LocalFontLoaderService } from '../services/localFontLoader';
import { isLocalFont, getLocalFontConfig } from '../fonts/manifest';

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Track which fonts are already registered to avoid duplicates
const registeredFonts = new Set<string>();

export const usePDFFonts = (family: string) => {
    const [loadedFamily, setLoadedFamily] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Retry function to trigger re-fetch
    const retry = useCallback(() => {
        setError(null);
        setLoadedFamily(null);
        setRetryCount(c => c + 1);
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadLocalFont = async () => {
            const config = getLocalFontConfig(family);
            if (!config) {
                throw new Error(`Local font config not found for ${family}`);
            }

            console.log(`[usePDFFonts] Loading local font: ${family}`);

            // Check if already registered
            if (registeredFonts.has(family)) {
                console.log(`[usePDFFonts] ${family} already registered, skipping`);
                if (mounted) {
                    setLoadedFamily(family);
                    setError(null);
                }
                return;
            }

            // Load Regular, Bold, and Italic variants in parallel
            const results = await Promise.allSettled([
                LocalFontLoaderService.getLocalFontBlob(config, 400, 'normal'),
                LocalFontLoaderService.getLocalFontBlob(config, 700, 'normal'),
                LocalFontLoaderService.getLocalFontBlob(config, 400, 'italic')
            ]);

            if (!mounted) return;

            const fontsToRegister: { src: string; fontWeight?: number; fontStyle?: 'normal' | 'italic' }[] = [];

            // Regular (400)
            if (results[0].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[0].value);
                const dataUrl = `data:font/ttf;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'normal' });
            } else {
                console.warn(`[usePDFFonts] Failed to load Regular for ${family}`, results[0].reason);
            }

            // Bold (700)
            if (results[1].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[1].value);
                const dataUrl = `data:font/ttf;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 700, fontStyle: 'normal' });
            } else if (results[0].status === 'fulfilled') {
                // Fallback: use regular as bold
                const base64 = arrayBufferToBase64(results[0].value);
                const dataUrl = `data:font/ttf;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 700, fontStyle: 'normal' });
                console.log(`[usePDFFonts] Using Regular as Bold fallback for ${family}`);
            }

            // Italic (400 italic)
            if (results[2].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[2].value);
                const dataUrl = `data:font/ttf;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'italic' });
            } else if (results[0].status === 'fulfilled') {
                // Fallback: use regular as italic
                const base64 = arrayBufferToBase64(results[0].value);
                const dataUrl = `data:font/ttf;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'italic' });
                console.log(`[usePDFFonts] Using Regular as Italic fallback for ${family}`);
            }

            if (fontsToRegister.length > 0) {
                Font.register({
                    family: family,
                    fonts: fontsToRegister
                });
                registeredFonts.add(family);
                console.log(`[usePDFFonts] Registered local font ${family} with ${fontsToRegister.length} variants`);
                if (mounted) {
                    setLoadedFamily(family);
                    setError(null);
                }
            } else {
                throw new Error(`No variants loaded for ${family}`);
            }
        };

        const loadRemoteFont = async () => {
            console.log(`[usePDFFonts] Loading remote font: ${family}`);

            // Check if already registered
            if (registeredFonts.has(family)) {
                console.log(`[usePDFFonts] ${family} already registered, skipping`);
                if (mounted) {
                    setLoadedFamily(family);
                    setError(null);
                }
                return;
            }

            // Parallel fetch for Regular (400), Bold (700), and Italic (400 italic)
            const results = await Promise.allSettled([
                FontLoaderService.getFontBlob(family, 400, 'normal'),
                FontLoaderService.getFontBlob(family, 700, 'normal'),
                FontLoaderService.getFontBlob(family, 400, 'italic')
            ]);

            if (!mounted) return;

            const fontsToRegister: { src: string; fontWeight?: number; fontStyle?: 'normal' | 'italic' }[] = [];

            // Check Regular (Index 0)
            if (results[0].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[0].value);
                const dataUrl = `data:font/woff;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'normal' });
            } else {
                console.warn(`[usePDFFonts] Failed to load Regular 400 for ${family}`, results[0].reason);
            }

            // Check Bold (Index 1)
            if (results[1].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[1].value);
                const dataUrl = `data:font/woff;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 700, fontStyle: 'normal' });
            } else {
                console.warn(`[usePDFFonts] Failed to load Bold 700 for ${family}, falling back to Regular`, results[1].reason);
                if (results[0].status === 'fulfilled') {
                    const base64 = arrayBufferToBase64(results[0].value);
                    const dataUrl = `data:font/woff;base64,${base64}`;
                    fontsToRegister.push({ src: dataUrl, fontWeight: 700, fontStyle: 'normal' });
                    console.log(`[usePDFFonts] Registered Regular as Bold fallback for ${family}`);
                }
            }

            // Check Italic (Index 2)
            if (results[2].status === 'fulfilled') {
                const base64 = arrayBufferToBase64(results[2].value);
                const dataUrl = `data:font/woff;base64,${base64}`;
                fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'italic' });
                console.log(`[usePDFFonts] Loaded Italic for ${family}`);
            } else {
                console.warn(`[usePDFFonts] Failed to load Italic for ${family}`, results[2].reason);
                if (results[0].status === 'fulfilled') {
                    const base64 = arrayBufferToBase64(results[0].value);
                    const dataUrl = `data:font/woff;base64,${base64}`;
                    fontsToRegister.push({ src: dataUrl, fontWeight: 400, fontStyle: 'italic' });
                    console.log(`[usePDFFonts] Registered Regular as Italic fallback for ${family}`);
                }
            }

            if (fontsToRegister.length > 0) {
                Font.register({
                    family: family,
                    fonts: fontsToRegister
                });
                registeredFonts.add(family);
                console.log(`[usePDFFonts] Registered ${family} with ${fontsToRegister.length} variants`);
                if (mounted) {
                    setLoadedFamily(family);
                    setError(null);
                }
            } else {
                console.warn(`[usePDFFonts] No fonts loaded for ${family}. Font may not exist.`);
                if (mounted) {
                    setError(`Font "${family}" not found. Please select a different font.`);
                }
            }
        };

        const load = async () => {
            try {
                if (isLocalFont(family)) {
                    await loadLocalFont();
                } else {
                    await loadRemoteFont();
                }
            } catch (err) {
                console.warn(`Font load failure for ${family}`, err);
                if (mounted) {
                    setError(`Failed to load font "${family}".`);
                }
            }
        };

        if (family) {
            // Reset states on new family request
            setLoadedFamily(null);
            setError(null);
            load();
        } else {
            setLoadedFamily(family);
        }

        return () => { mounted = false; };
    }, [family, retryCount]);

    const isLoaded = loadedFamily === family && !error;
    return { isLoaded, error, retry };
};
