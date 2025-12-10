import { Tabs, TabsList, TabsTrigger } from '@/design-system/components/Tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/design-system/animations';
import { useState, lazy, Suspense, memo } from 'react';
import { ProfileForm } from '../editor/forms/ProfileForm';
import { ExperienceForm } from '../editor/forms/ExperienceForm';
import { EducationForm } from '../editor/forms/EducationForm';
import { SkillsForm } from '../editor/forms/SkillsForm';
import { AwardsForm } from '../editor/forms/AwardsForm';
import { LoadingThunder } from '@/design-system/components';
import { FileText, Palette } from 'lucide-react';

// Lazy load DesignPanel (includes heavy FontPicker)
const DesignPanel = lazy(() => import('../editor/DesignPanel').then(m => ({ default: m.DesignPanel })));

// Memoized section divider
const SectionDivider = memo(() => <div className="h-px bg-border w-full my-6" />);
SectionDivider.displayName = 'SectionDivider';

// Loading fallback for lazy components
const LazyFallback = () => (
    <div className="flex items-center justify-center py-12">
        <LoadingThunder size="md" className="text-muted-foreground" />
    </div>
);

export const ControlDeck = () => {
    const [activeTab, setActiveTab] = useState('content');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
                <div className="shrink-0 bg-card z-10 border-b border-border px-4 py-3 sticky top-0">
                    <TabsList className="w-full grid grid-cols-2 bg-muted/60 p-1.5 h-auto rounded-xl gap-1.5">
                        <TabsTrigger
                            value="content"
                            className="rounded-lg py-2.5 px-4 text-sm font-medium text-muted-foreground transition-all inline-flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-border/50"
                        >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span>Content</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="design"
                            className="rounded-lg py-2.5 px-4 text-sm font-medium text-muted-foreground transition-all inline-flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-border/50"
                        >
                            <Palette className="w-4 h-4 shrink-0" />
                            <span>Design</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'content' ? (
                            <motion.div
                                key="content"
                                variants={fadeIn}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-8 outline-none"
                            >
                                <section id="profile" className="space-y-4">
                                    <ProfileForm />
                                </section>
                                <SectionDivider />
                                <section id="experience" className="space-y-4">
                                    <ExperienceForm />
                                </section>
                                <SectionDivider />
                                <section id="education" className="space-y-4">
                                    <EducationForm />
                                </section>
                                <SectionDivider />
                                <section id="skills" className="space-y-4">
                                    <SkillsForm />
                                </section>
                                <SectionDivider />
                                <section id="awards" className="space-y-4">
                                    <AwardsForm />
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="design"
                                variants={fadeIn}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="outline-none"
                            >
                                <Suspense fallback={<LazyFallback />}>
                                    <DesignPanel />
                                </Suspense>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Tabs>
        </div>
    );
};
