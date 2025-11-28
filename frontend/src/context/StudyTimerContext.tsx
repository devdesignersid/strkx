import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface StudyTimerContextType {
  time: number; // in seconds
  isActive: boolean;
  isPaused: boolean;
  isEnabled: boolean;
  testReminder: { type: string; message: string } | null;
  toggleTimer: () => void;
  stopTimer: () => void;
  formatTime: (seconds: number) => string;
  toggleEnabled: (enabled: boolean) => void;
  triggerTestReminder: (type: string) => void;
  clearTestReminder: () => void;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

export const useStudyTimer = () => {
  const context = useContext(StudyTimerContext);
  if (!context) {
    throw new Error('useStudyTimer must be used within a StudyTimerProvider');
  }
  return context;
};

export const StudyTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [testReminder, setTestReminder] = useState<{ type: string; message: string } | null>(null);

  // Refs for state that shouldn't trigger re-renders or needs to be accessed in intervals
  const timeRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Constants
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Load enabled state
  useEffect(() => {
    const savedEnabled = localStorage.getItem('study_timer_enabled');
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
    }
  }, []);

  const toggleEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('study_timer_enabled', String(enabled));
    if (!enabled) {
      stopTimer();
    }
  };

  const triggerTestReminder = (type: string) => {
    setTestReminder({ type, message: 'This is a test reminder to check the modal style.' });
  };

  const clearTestReminder = () => setTestReminder(null);

  useEffect(() => {
    // Initialize BroadcastChannel
    channelRef.current = new BroadcastChannel('study_timer_channel');

    // Load from local storage
    const savedTime = localStorage.getItem('study_time_today');
    const savedDate = localStorage.getItem('study_date');
    const today = new Date().toISOString().split('T')[0];

    if (savedDate === today && savedTime) {
      setTime(parseInt(savedTime, 10));
      timeRef.current = parseInt(savedTime, 10);
    } else {
      // New day or first run
      setTime(0);
      timeRef.current = 0;
      localStorage.setItem('study_date', today);
    }

    // Listen for messages
    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'SYNC_TIME') {
        setTime(payload.time);
        timeRef.current = payload.time;
        setIsActive(payload.isActive);
        setIsPaused(payload.isPaused);
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let interval: number;

    if (isActive && !isPaused && isEnabled) {
      lastTickRef.current = Date.now();

      interval = window.setInterval(() => {
        const now = Date.now();
        // Calculate delta to prevent drift
        const delta = Math.floor((now - lastTickRef.current) / 1000);

        if (delta >= 1) {
          timeRef.current += delta;
          setTime(timeRef.current); // Update state from ref
          lastTickRef.current = now;

          // Persist locally
          localStorage.setItem('study_time_today', timeRef.current.toString());

          // Broadcast to other tabs
          channelRef.current?.postMessage({
            type: 'SYNC_TIME',
            payload: {
              time: timeRef.current,
              isActive: true,
              isPaused: false
            }
          });

          // Check for midnight reset
          const today = new Date().toISOString().split('T')[0];
          const storedDate = localStorage.getItem('study_date');
          if (storedDate !== today) {
            // Day changed!
            handleDayReset();
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, isEnabled]);

  // Activity Tracking
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const events = ['mousemove', 'keydown', 'scroll', 'click'];

    const resetIdleTimer = () => {
      if (isPaused && isActive) {
        // Auto-resume logic if needed
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (isActive && !isPaused) {
          setIsPaused(true);
          // Notify user?
          if (Notification.permission === 'granted') {
             new Notification("Study Timer Paused", { body: "You've been idle for 5 minutes." });
          }
        }
      }, IDLE_TIMEOUT);
    };

    // Throttle event listeners
    let lastEventTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime > 1000) { // Throttle to 1s
        resetIdleTimer();
        lastEventTime = now;
      }
    };

    if (isActive && isEnabled) {
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetIdleTimer();
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(idleTimer);
    };
  }, [isActive, isPaused, isEnabled]);

  const handleDayReset = () => {
    timeRef.current = 0;
    setTime(0);
    localStorage.setItem('study_date', new Date().toISOString().split('T')[0]);
    localStorage.setItem('study_time_today', '0');
  };

  const toggleTimer = () => {
    if (isActive) {
      setIsPaused(!isPaused);
    } else {
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    syncToBackend(timeRef.current);
  };

  const syncToBackend = async (seconds: number) => {
    // Placeholder for backend sync
    console.log('Syncing to backend:', seconds);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };



  const contextValue = React.useMemo(() => ({
    time,
    isActive,
    isPaused,
    isEnabled,
    testReminder,
    toggleTimer,
    stopTimer,
    formatTime,
    toggleEnabled,
    triggerTestReminder,
    clearTestReminder
  }), [time, isActive, isPaused, isEnabled, testReminder]);

  return (
    <StudyTimerContext.Provider value={contextValue}>
      {children}
    </StudyTimerContext.Provider>
  );
};
