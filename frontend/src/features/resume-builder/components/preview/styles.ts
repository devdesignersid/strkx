import { StyleSheet } from '@react-pdf/renderer';
import type { ResumeDesign } from '../../types/schema';

// ============================================================================
// DESIGN TOKENS - Professional Engineer Resume Template
// ============================================================================

// Typography Scale (ATS-friendly, accessible sizes - minimum 10pt, preferred 11pt+)
export const TYPE = {
    name: { size: 24, weight: 700, lineHeight: 1.2, letterSpacing: -0.3 },
    sectionTitle: { size: 14, weight: 700, lineHeight: 1.3, letterSpacing: 0 },  // Increased from 12pt, removed uppercase
    jobTitle: { size: 12, weight: 600, lineHeight: 1.4, letterSpacing: 0 },      // Increased from 11pt
    company: { size: 11, weight: 400, lineHeight: 1.4, letterSpacing: 0 },       // Increased from 10.5pt
    body: { size: 11, weight: 400, lineHeight: 1.4, letterSpacing: 0 },          // Increased from 10.5pt
    meta: { size: 10, weight: 400, lineHeight: 1.4, letterSpacing: 0 },          // Increased from 9.5pt
} as const;

// Color Palette (High contrast for accessibility - WCAG AA compliant)
export const COLORS = {
    primary: '#111111',      // Boosted from #1a1a1a for maximum contrast
    secondary: '#1a1a1a',    // Boosted from #2d2d2d for body text
    muted: '#333333',        // Boosted from #4a4a4a for better contrast
    divider: '#cccccc',      // Section separators
    background: '#ffffff',   // Page background
} as const;

// Spacing Scale (Tight vertical rhythm for density)
export const SPACE = {
    xs: 2,    // Minimal inline spacing
    sm: 4,    // Tight bullet gaps
    md: 8,    // Between items
    lg: 14,   // Between sections
    xl: 18,   // Header separation
} as const;

// Page Dimensions (Narrower margins for more content)
export const PAGE = {
    marginX: 28,    // ~0.4 inch sides
    marginY: 24,    // ~0.33 inch top/bottom
    sidebarWidth: '32%',
    mainWidth: '68%',
    gutter: 20,
} as const;

// ============================================================================
// STYLE FACTORY
// ============================================================================

export const createResumeStyles = (design: ResumeDesign) => StyleSheet.create({
    // Page - use margin from design settings
    page: {
        paddingTop: design.margin || PAGE.marginY,
        paddingBottom: design.margin || PAGE.marginY,
        paddingLeft: design.margin || PAGE.marginX,
        paddingRight: design.margin || PAGE.marginX,
        fontFamily: design.fontBody,
        fontSize: TYPE.body.size,
        lineHeight: design.lineHeight || TYPE.body.lineHeight,
        color: design.bodyColor || COLORS.primary,
        backgroundColor: COLORS.background,
    },

    // Layout Containers
    verticalContainer: {
        // No flex: 1 to allow natural page wrapping
    },
    sidebarContainer: {
        flexDirection: 'row',
        flex: 1,
    },
    sidebarLeft: {
        width: PAGE.sidebarWidth,
        paddingRight: PAGE.gutter,
        borderRightWidth: 0.75,
        borderRightColor: COLORS.divider,
    },
    sidebarRight: {
        width: PAGE.mainWidth,
        paddingLeft: PAGE.gutter,
    },

    // Header (Centered for vertical layout)
    header: {
        marginBottom: SPACE.lg,
        alignItems: 'center',
    },
    headerVertical: {
        paddingBottom: SPACE.md,
    },
    name: {
        fontFamily: design.fontHeading || design.fontBody,
        fontSize: TYPE.name.size,
        fontWeight: TYPE.name.weight,
        color: design.headingColor || design.accentColor || COLORS.primary,
        lineHeight: TYPE.name.lineHeight,
        letterSpacing: TYPE.name.letterSpacing,
        marginBottom: SPACE.md,
        textAlign: 'center',
    },
    nameSidebar: {
        fontSize: 22,
        marginBottom: SPACE.md,
        textAlign: 'left',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    contactItem: {
        fontSize: TYPE.meta.size,
        color: COLORS.secondary,
        lineHeight: TYPE.meta.lineHeight,
    },
    contactSeparator: {
        fontSize: TYPE.meta.size,
        color: COLORS.muted,
        marginLeft: SPACE.sm + 4,
        marginRight: SPACE.sm + 4,
    },
    contactStack: {
        marginBottom: SPACE.lg,
    },
    contactStackItem: {
        fontSize: TYPE.meta.size,
        color: COLORS.secondary,
        marginBottom: SPACE.xs,
        lineHeight: TYPE.meta.lineHeight,
    },
    contactLink: {
        textDecoration: 'none',
        color: design.accentColor || COLORS.secondary,
    },
    contactItemLink: {
        fontSize: TYPE.meta.size,
        color: design.accentColor || COLORS.secondary,
        lineHeight: TYPE.meta.lineHeight,
        borderBottomWidth: 0.5,
        borderBottomColor: design.accentColor || COLORS.secondary,
        paddingBottom: 1,
    },

    // Sections
    section: {
        marginBottom: SPACE.lg,
    },
    sectionSpacer: {
        marginBottom: SPACE.lg, // Space after each section
    },
    sectionTitle: {
        fontFamily: design.fontHeading || design.fontBody,
        fontSize: TYPE.sectionTitle.size,
        fontWeight: TYPE.sectionTitle.weight,
        color: design.headingColor || design.accentColor || COLORS.primary,
        // Removed textTransform: 'uppercase' for ATS compatibility
        letterSpacing: TYPE.sectionTitle.letterSpacing,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.divider,
        paddingBottom: 3,
        marginBottom: SPACE.sm + 2,
        lineHeight: TYPE.sectionTitle.lineHeight,
    },
    sectionTitleSidebar: {
        fontSize: 10,
        letterSpacing: 0.8,
        marginBottom: SPACE.sm,
    },

    // Summary
    summary: {
        fontSize: TYPE.body.size,
        color: design.bodyColor || COLORS.secondary,
        lineHeight: design.lineHeight || TYPE.body.lineHeight,
    },

    // Experience / Education Items
    itemBlock: {
        marginBottom: 0, // No margin here, spacer handles it
    },
    itemSpacer: {
        marginBottom: SPACE.md + 4, // Spacing between experience items
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    itemTitle: {
        fontSize: TYPE.jobTitle.size,
        fontWeight: TYPE.jobTitle.weight,
        color: design.bodyColor || COLORS.primary,
        lineHeight: TYPE.jobTitle.lineHeight,
    },
    itemDate: {
        fontSize: TYPE.meta.size,
        color: design.accentColor || COLORS.muted,
        lineHeight: TYPE.meta.lineHeight,
    },
    itemSubtitle: {
        fontSize: TYPE.company.size,
        // Removed fontStyle: 'italic' for ATS compatibility
        color: design.bodyColor || COLORS.secondary,
        marginBottom: SPACE.xs,
        lineHeight: TYPE.company.lineHeight,
    },

    // Bullets (Tight spacing for professional density)
    bulletList: {
        marginTop: 2,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bulletMarker: {
        width: 10,
        fontSize: TYPE.body.size,
        color: COLORS.secondary,
    },
    bulletText: {
        flex: 1,
        fontSize: TYPE.body.size,
        color: design.bodyColor || COLORS.secondary,
        lineHeight: design.lineHeight || TYPE.body.lineHeight,
    },
    // Plain body text (for non-bulleted descriptions)
    body: {
        fontSize: TYPE.body.size,
        color: design.bodyColor || COLORS.secondary,
        lineHeight: design.lineHeight || TYPE.body.lineHeight,
        marginBottom: 1,
    },

    // Skills
    skillCategory: {
        marginBottom: 4,
    },
    skillCategoryName: {
        fontSize: TYPE.body.size,
        fontWeight: 700,
        color: design.bodyColor || COLORS.primary,
    },
    skillCategoryList: {
        fontSize: TYPE.body.size,
        color: design.bodyColor || COLORS.secondary,
    },

    // Skill Sidebar list
    skillSidebarBlock: {
        marginBottom: SPACE.sm,
    },
    skillSidebarCategory: {
        fontSize: 10,
        fontWeight: 600,
        color: COLORS.secondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    skillSidebarList: {
        fontSize: TYPE.meta.size,
        color: COLORS.secondary,
        lineHeight: 1.4,
    },

    // Education (Compact)
    educationCompact: {
        marginBottom: SPACE.md,
    },
    educationTitle: {
        fontSize: TYPE.body.size,
        fontWeight: 600,
        color: design.bodyColor || COLORS.primary,
        lineHeight: TYPE.body.lineHeight,
    },
    educationMeta: {
        fontSize: TYPE.meta.size,
        color: COLORS.muted,
        lineHeight: TYPE.meta.lineHeight,
    },
});

export type ResumeStyles = ReturnType<typeof createResumeStyles>;
