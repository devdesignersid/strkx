import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useStudyTimer } from '../../context/StudyTimerContext';

const FloatingTimer: React.FC = () => {
  const { time, isActive, isPaused, isEnabled, toggleTimer, stopTimer, formatTime } = useStudyTimer();
  const [isHovered, setIsHovered] = useState(false);

  if (!isEnabled) return null;

  // Variants for animation
  const containerVariants = {
    idle: {
      width: '40px',
      height: '40px',
      borderRadius: '20px',
      backgroundColor: isActive && !isPaused ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: { duration: 0.3, ease: "easeInOut" as const }
    },
    hovered: {
      width: 'auto',
      height: '48px',
      borderRadius: '24px',
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      paddingRight: '16px',
      transition: { duration: 0.3, ease: "easeInOut" as const }
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex items-center overflow-hidden shadow-lg cursor-pointer group"
      variants={containerVariants}
      initial="idle"
      animate={isHovered ? "hovered" : "idle"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => !isHovered && setIsHovered(true)} // Tap to expand on mobile
    >
      {/* Icon / Status Dot */}
      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
        {isActive && !isPaused ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          />
        ) : (
          <Clock className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-4 pl-1"
          >
            <span className="font-mono text-sm font-medium text-white tracking-wider">
              {formatTime(time)}
            </span>

            <div className="h-4 w-[1px] bg-gray-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                {isActive && !isPaused ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); stopTimer(); }}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingTimer;
