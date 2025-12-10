import type { ReactNode } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { motion } from 'framer-motion';
import { fadeIn } from '@/design-system/animations';

interface StudioLayoutProps {
    controlDeck: ReactNode;
    liveCanvas: ReactNode;
}

export const StudioLayout = ({ controlDeck, liveCanvas }: StudioLayoutProps) => {
    return (
        <div className="h-full w-full bg-background overflow-hidden relative">
            <PanelGroup direction="horizontal">
                {/* LEFT: Control Deck (Content & Design) */}
                <Panel defaultSize={40} minSize={30} maxSize={50} className="bg-card border-r border-border flex flex-col z-10">
                    {controlDeck}
                </Panel>

                <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors z-20" />

                {/* CENTER: Live Canvas (PDF Preview) */}
                <Panel defaultSize={60} minSize={50} className="bg-muted/30 relative flex flex-col items-center justify-center overflow-hidden z-0">
                    <motion.div
                        className="w-full h-full"
                        variants={fadeIn}
                        initial="initial"
                        animate="animate"
                    >
                        {liveCanvas}
                    </motion.div>
                </Panel>
            </PanelGroup>
        </div>
    );
};
