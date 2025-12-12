import { memo, useCallback } from 'react';
import { useProfile, useSummary, useSetDraft } from '../../../hooks/useResumeStore';
import { Input } from '@/design-system/components/Input';
import { Label } from '@/design-system/components/Label';
import { RichTextEditor } from '../RichTextEditor';

export const ProfileForm = memo(() => {
    // Use granular selectors for better performance
    const profile = useProfile();
    const summary = useSummary();
    const setDraft = useSetDraft();

    const updateProfile = useCallback((key: string, value: string) => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                profile: { ...prev.content.profile, [key]: value }
            }
        }));
    }, [setDraft]);

    const updateSummary = useCallback((value: string) => {
        setDraft(prev => ({
            ...prev,
            content: { ...prev.content, summary: value }
        }));
    }, [setDraft]);

    return (
        <div className="space-y-6 p-1">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            value={profile.name}
                            onChange={e => updateProfile('name', e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            value={profile.email}
                            onChange={e => updateProfile('email', e.target.value)}
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                            value={profile.phone}
                            onChange={e => updateProfile('phone', e.target.value)}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={profile.location}
                            onChange={e => updateProfile('location', e.target.value)}
                            placeholder="San Francisco, CA"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>LinkedIn URL</Label>
                        <Input
                            value={profile.linkedin}
                            onChange={e => updateProfile('linkedin', e.target.value)}
                            placeholder="https://linkedin.com/in/johndoe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>GitHub URL</Label>
                        <Input
                            value={profile.github}
                            onChange={e => updateProfile('github', e.target.value)}
                            placeholder="https://github.com/johndoe"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Professional Summary</Label>
                <RichTextEditor
                    value={summary || ''}
                    onChange={updateSummary}
                    placeholder="Briefly describe your professional background and key achievements..."
                />
            </div>
        </div>
    );
});

ProfileForm.displayName = 'ProfileForm';

