export const VALIDATION_LIMITS = {
  PROBLEM: {
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 15000, // Increased to support detailed DESIGN problems
    TAG_MAX_LENGTH: 50, // Increased to support tags like "Heap (Priority Queue)"
    MAX_TAGS: 10,
  },
  LIST: {
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 200,
  },
  USER: {
    NAME_MAX_LENGTH: 50,
  },
  COMMENT: {
    MAX_LENGTH: 1000,
  },
} as const;
