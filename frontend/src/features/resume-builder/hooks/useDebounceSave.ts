/**
 * No-op hook. Persist middleware handles draft persistence automatically.
 * commit() removed to prevent conflict with hasChanges Save button logic.
 */
export const useDebounceSave = (_delay: number = 600) => { };
