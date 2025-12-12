import { Document, Page, Text, View, Link } from '@react-pdf/renderer';
import type { ResumeData, ResumeExperience, ResumeEducation, ResumeAward } from '../../types/schema';
import { createResumeStyles, type ResumeStyles } from './styles';

// ============================================================================
// HELPER UTILITIES
// ============================================================================

const has = (str?: string): boolean => !!str && str.trim().length > 0;

// Parse description - detect type for each line individually
type ParsedLine = { type: 'bullet' | 'number' | 'plain'; text: string; index?: number };

const parseDescription = (description: string): ParsedLine[] => {
    if (!description) return [];

    const lines = description.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);

    return lines.map((line): ParsedLine => {
        // Check if line starts with a numbered list marker (1. 2. etc)
        const numberMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (numberMatch) {
            return { type: 'number', text: numberMatch[2], index: parseInt(numberMatch[1]) };
        }

        // Check if line starts with a bullet marker
        const bulletMatch = line.match(/^[-*+•]\s+(.*)$/);
        if (bulletMatch) {
            return { type: 'bullet', text: bulletMatch[1] };
        }

        // Plain text
        return { type: 'plain', text: line };
    });
};

// Format date range
const formatDateRange = (start: string = '', end: string = '', isCurrent: boolean = false): string => {
    if (!start) return '';
    const endDisplay = isCurrent ? 'Present' : (end || 'Present');
    return `${start} — ${endDisplay}`;
};

// Parse markdown inline formatting (bold and italic) into React-PDF Text elements
// Uses a clean stack-based tokenizing approach to support nested formatting (e.g. **bold *italic***)
const parseMarkdownInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const parts: React.ReactNode[] = [];
    let buffer = '';
    let i = 0;
    let bold = false;
    let italic = false;

    const flush = () => {
        if (buffer) {
            parts.push(
                <Text key={parts.length} style={{
                    fontWeight: bold ? 'bold' : 'normal',
                    fontStyle: italic ? 'italic' : 'normal'
                }}>
                    {buffer}
                </Text>
            );
            buffer = '';
        }
    };

    while (i < text.length) {
        // Check for Bold (**)
        if (text.startsWith('**', i)) {
            flush();
            bold = !bold;
            i += 2;
        }
        // Check for Italic (*)
        // We prioritize ** over * by checking it first
        else if (text.startsWith('*', i)) {
            flush();
            italic = !italic;
            i += 1;
        }
        else {
            buffer += text[i];
            i++;
        }
    }
    flush();

    return parts;
};


// ============================================================================
// ATOMIC COMPONENTS
// ============================================================================

// Description Renderer - handles each line according to its own type (bullet, number, or plain)
// Returns fragments directly without a wrapper View to allow page breaks between items
const DescriptionBlock = ({ description, styles, textStyle }: { description: string; styles: ResumeStyles, textStyle?: any }) => {
    const parsedLines = parseDescription(description);

    if (parsedLines.length === 0) return null;

    return (
        <>
            {parsedLines.map((line, idx) => {
                if (line.type === 'bullet') {
                    return (
                        // wrap={false} keeps bullet marker and text together on same page
                        <View key={idx} style={styles.bulletItem} wrap={false}>
                            <Text style={styles.bulletMarker}>•</Text>
                            <Text style={styles.bulletText}>{parseMarkdownInline(line.text)}</Text>
                        </View>
                    );
                }

                if (line.type === 'number') {
                    return (
                        <View key={idx} style={styles.bulletItem} wrap={false}>
                            <Text style={styles.bulletMarker}>{line.index}.</Text>
                            <Text style={styles.bulletText}>{parseMarkdownInline(line.text)}</Text>
                        </View>
                    );
                }

                // Plain text
                return (
                    <Text key={idx} style={textStyle || styles.body}>{parseMarkdownInline(line.text)}</Text>
                );
            })}
        </>
    );
};

// Section Component - uses fragment instead of View to allow content to break across pages
const Section = ({ title, children, styles, sidebarStyle = false }: {
    title: string;
    children: React.ReactNode;
    styles: ResumeStyles;
    sidebarStyle?: boolean;
}) => (
    <>
        <Text
            style={[styles.sectionTitle, sidebarStyle ? styles.sectionTitleSidebar : {}]}
            minPresenceAhead={20}
        >
            {title}
        </Text>
        {children}
        {/* Spacer between sections */}
        <View style={styles.sectionSpacer} />
    </>
);

// ============================================================================
// CONTENT COMPONENTS
// ============================================================================

// URL Formatters - strip https://www. and display clean format
const formatLinkedIn = (url: string): string => {
    if (!url) return '';
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};

const formatGitHub = (url: string): string => {
    if (!url) return '';
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};

// SVG Icons for PDF (using @react-pdf/renderer Svg component)
import { Svg, Path } from '@react-pdf/renderer';

const ICON_SIZE = 11;
const DEFAULT_ICON_COLOR = '#4a4a4a';

// Envelope icon (email)
const EmailIcon = ({ color = DEFAULT_ICON_COLOR }: { color?: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 4 }}>
        <Path fill={color} d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </Svg>
);

// Phone icon
const PhoneIcon = ({ color = DEFAULT_ICON_COLOR }: { color?: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 4 }}>
        <Path fill={color} d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </Svg>
);

// GitHub icon
const GitHubIcon = ({ color = DEFAULT_ICON_COLOR }: { color?: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 4 }}>
        <Path fill={color} d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </Svg>
);

// LinkedIn icon
const LinkedInIcon = ({ color = DEFAULT_ICON_COLOR }: { color?: string }) => (
    <Svg viewBox="0 0 24 24" style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 4 }}>
        <Path fill={color} d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" />
    </Svg>
);

// New multi-line contact layout matching the reference image with SVG icons
const ContactRow = ({ profile, styles }: { profile: ResumeData['content']['profile'], styles: ResumeStyles }) => {
    // Get the accent color from styles for icons to match text
    const iconColor = (styles.contactItemLink as { color?: string })?.color || DEFAULT_ICON_COLOR;

    // Common style for icon+text wrapper to ensure vertical centering
    const iconTextWrapper = { flexDirection: 'row' as const, alignItems: 'center' as const };

    return (
        <View style={{ alignItems: 'center' }}>
            {/* Line 1: Email | Phone */}
            {(has(profile.email) || has(profile.phone)) && (
                <View style={styles.contactRow}>
                    {has(profile.email) && (
                        <Link src={`mailto:${profile.email}`} style={styles.contactLink}>
                            <View style={iconTextWrapper}>
                                <EmailIcon color={iconColor} />
                                <Text style={styles.contactItemLink}>{profile.email}</Text>
                            </View>
                        </Link>
                    )}
                    {has(profile.email) && has(profile.phone) && (
                        <Text style={styles.contactSeparator}>|</Text>
                    )}
                    {has(profile.phone) && (
                        <View style={iconTextWrapper}>
                            <PhoneIcon color={iconColor} />
                            <Text style={styles.contactItemLink}>{profile.phone}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Line 2: GitHub | LinkedIn */}
            {(has(profile.github) || has(profile.linkedin)) && (
                <View style={styles.contactRow}>
                    {has(profile.github) && (
                        <Link src={profile.github} style={styles.contactLink}>
                            <View style={iconTextWrapper}>
                                <GitHubIcon color={iconColor} />
                                <Text style={styles.contactItemLink}>{formatGitHub(profile.github)}</Text>
                            </View>
                        </Link>
                    )}
                    {has(profile.github) && has(profile.linkedin) && (
                        <Text style={styles.contactSeparator}>|</Text>
                    )}
                    {has(profile.linkedin) && (
                        <Link src={profile.linkedin} style={styles.contactLink}>
                            <View style={iconTextWrapper}>
                                <LinkedInIcon color={iconColor} />
                                <Text style={styles.contactItemLink}>{formatLinkedIn(profile.linkedin)}</Text>
                            </View>
                        </Link>
                    )}
                </View>
            )}
        </View>
    );
};

const ContactStack = ({ profile, styles }: { profile: ResumeData['content']['profile'], styles: ResumeStyles }) => (
    <View style={styles.contactStack}>
        {has(profile.location) && <Text style={styles.contactStackItem}>{profile.location}</Text>}
        {has(profile.email) && (
            <Link src={`mailto:${profile.email}`} style={styles.contactLink}>
                <Text style={styles.contactStackItem}>{profile.email}</Text>
            </Link>
        )}
        {has(profile.phone) && <Text style={styles.contactStackItem}>{profile.phone}</Text>}
        {has(profile.linkedin) && (
            <Link src={profile.linkedin} style={styles.contactLink}>
                <Text style={styles.contactStackItem}>LinkedIn Profile</Text>
            </Link>
        )}
        {has(profile.website) && (
            <Link src={profile.website} style={styles.contactLink}>
                <Text style={styles.contactStackItem}>Portfolio</Text>
            </Link>
        )}
    </View>
);

const ExperienceItem = ({ item, styles }: { item: ResumeExperience, styles: ResumeStyles }) => (
    <>
        {/* Keep header together and ensure some content follows before page break */}
        <View style={styles.itemBlock} wrap={false} minPresenceAhead={40}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.position}</Text>
                <Text style={styles.itemDate}>
                    {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                </Text>
            </View>
            <Text style={styles.itemSubtitle}>{item.company}{item.location ? `, ${item.location}` : ''}</Text>
        </View>
        {/* Description can break across pages */}
        <DescriptionBlock description={item.description} styles={styles} />
        {/* Spacer between items */}
        <View style={styles.itemSpacer} />
    </>
);

const EducationItem = ({ item, styles }: { item: ResumeEducation, styles: ResumeStyles }) => (
    <>
        <View style={styles.itemBlock} wrap={false} minPresenceAhead={40}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.institution}</Text>
                <Text style={styles.itemDate}>
                    {item.graduationYear || (item.startDate ? formatDateRange(item.startDate, item.endDate, !!item.isCurrent) : '')}
                </Text>
            </View>
            <Text style={styles.itemSubtitle}>
                {[item.degree, item.field].filter(Boolean).join(' in ')}
            </Text>
        </View>
        {item.description ? <DescriptionBlock description={item.description} styles={styles} /> : null}
        <View style={styles.itemSpacer} />
    </>
);

const AwardsItem = ({ item, styles }: { item: ResumeAward, styles: ResumeStyles }) => (
    <>
        <View style={styles.itemBlock} wrap={false} minPresenceAhead={40}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
            </View>
            <Text style={styles.itemSubtitle}>{item.issuer}</Text>
        </View>
        {item.description ? <DescriptionBlock description={item.description} styles={styles} /> : null}
        <View style={styles.itemSpacer} />
    </>
);

const EducationCompact = ({ item, styles }: { item: ResumeEducation, styles: ResumeStyles }) => (
    <View style={styles.educationCompact}>
        <Text style={styles.educationTitle}>{item.degree}</Text>
        <Text style={styles.educationMeta}>{item.institution}</Text>
        {item.graduationYear && <Text style={styles.educationMeta}>{item.graduationYear}</Text>}
    </View>
);

// New Grouped Skills Renderer
const SkillsGrouped = ({ categories, styles }: { categories: ResumeData['content']['skillCategories'], styles: ResumeStyles }) => (
    <View>
        {categories.map((cat, idx) => (
            <View key={cat.id || idx} style={styles.skillCategory}>
                <Text style={styles.skillCategoryList}>
                    <Text style={styles.skillCategoryName}>{cat.name}: </Text>
                    {cat.skills.join(', ')}
                </Text>
            </View>
        ))}
    </View>
);

// New Sidebar Skills Renderer - comma separator for ATS compatibility
const SkillsSidebar = ({ categories, styles }: { categories: ResumeData['content']['skillCategories'], styles: ResumeStyles }) => (
    <View>
        {categories.map((cat, idx) => (
            <View key={cat.id || idx} style={styles.skillSidebarBlock}>
                <Text style={styles.skillSidebarCategory}>{cat.name}</Text>
                <Text style={styles.skillSidebarList}>
                    {cat.skills.join(', ')}
                </Text>
            </View>
        ))}
    </View>
);


// ============================================================================
// COMPOSITE LAYOUTS
// ============================================================================

const VerticalLayout = ({ data, styles }: { data: ResumeData, styles: ResumeStyles }) => (
    <>
        {/* Header - keep together as one block */}
        <View style={[styles.header, styles.headerVertical]} wrap={false}>
            <Text style={styles.name}>{data.content.profile.name}</Text>
            <ContactRow profile={data.content.profile} styles={styles} />
        </View>

        {/* Summary - ATS-friendly title */}
        {has(data.content.summary) && (
            <Section title="Summary" styles={styles}>
                <DescriptionBlock description={data.content.summary} styles={styles} textStyle={styles.summary} />
            </Section>
        )}

        {/* Experience - FIRST for ATS priority (most important section) */}
        {data.content.experience.length > 0 && (
            <Section title="Experience" styles={styles}>
                {data.content.experience.map(item => (
                    <ExperienceItem key={item.id} item={item} styles={styles} />
                ))}
            </Section>
        )}

        {/* Education */}
        {data.content.education.length > 0 && (
            <Section title="Education" styles={styles}>
                {data.content.education.map(item => (
                    <EducationItem key={item.id} item={item} styles={styles} />
                ))}
            </Section>
        )}

        {/* Skills - ATS parses better after Experience context */}
        {(data.content.skillCategories?.length > 0) && (
            <Section title="Skills" styles={styles}>
                <SkillsGrouped categories={data.content.skillCategories} styles={styles} />
            </Section>
        )}

        {/* Awards */}
        {(data.content.awards?.length > 0) && (
            <Section title="Awards" styles={styles}>
                {data.content.awards.map(item => (
                    <AwardsItem key={item.id} item={item} styles={styles} />
                ))}
            </Section>
        )}
    </>
);

const SidebarLayout = ({ data, styles }: { data: ResumeData, styles: ResumeStyles }) => (
    <View style={styles.sidebarContainer}>
        {/* Left Sidebar */}
        <View style={styles.sidebarLeft}>
            <Text style={[styles.name, styles.nameSidebar]}>{data.content.profile.name}</Text>

            <Section title="Contact" styles={styles} sidebarStyle>
                <ContactStack profile={data.content.profile} styles={styles} />
            </Section>

            {data.content.education.length > 0 && (
                <Section title="Education" styles={styles} sidebarStyle>
                    {data.content.education.map(item => (
                        <EducationCompact key={item.id} item={item} styles={styles} />
                    ))}
                </Section>
            )}

            {(data.content.skillCategories?.length > 0) && (
                <Section title="Skills" styles={styles} sidebarStyle>
                    <SkillsSidebar categories={data.content.skillCategories} styles={styles} />
                </Section>
            )}
        </View>

        {/* Right Content */}
        <View style={styles.sidebarRight}>
            {has(data.content.summary) && (
                <View style={{ marginBottom: (data.design.lineHeight || 1.5) * 12 }}>
                    <DescriptionBlock description={data.content.summary} styles={styles} textStyle={styles.summary} />
                </View>
            )}

            {data.content.experience.length > 0 && (
                <Section title="Experience" styles={styles}>
                    {data.content.experience.map(item => (
                        <ExperienceItem key={item.id} item={item} styles={styles} />
                    ))}
                </Section>
            )}

            {(data.content.awards?.length > 0) && (
                <Section title="Awards" styles={styles}>
                    {data.content.awards.map(item => (
                        <AwardsItem key={item.id} item={item} styles={styles} />
                    ))}
                </Section>
            )}
        </View>
    </View>
);

// ============================================================================
// MAIN DOCUMENT
// ============================================================================

export const ResumeDocument = ({ data }: { data: ResumeData }) => {
    const styles = createResumeStyles(data.design);
    const Layout = data.design.layout === 'sidebar' ? SidebarLayout : VerticalLayout;

    // Generate filename: "Firstname_Lastname_resume" or "resume" if no name
    const fileName = data.content.profile.name
        ? `${data.content.profile.name.trim().replace(/\s+/g, '_')}_resume`
        : 'resume';

    return (
        <Document title={fileName}>
            <Page size="A4" style={styles.page} wrap>
                <Layout data={data} styles={styles} />
            </Page>
        </Document>
    );
};
