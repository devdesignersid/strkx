import { useEffect } from 'react';
import { useResumeStore } from './useResumeStore';

export const useDebounceSave = (delay: number = 600) => {
    const commit = useResumeStore((state) => state.commit);
    const draft = useResumeStore((state) => state.draft);

    useEffect(() => {
        const id = setTimeout(() => {
            commit();
        }, delay);
        return () => clearTimeout(id);
    }, [draft, commit, delay]);
};
