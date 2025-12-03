import React, { useEffect, useRef, useState } from 'react';
import { useStudyTimer } from '../../../context/StudyTimerContext';
import ReminderModal from './ReminderModal';

// Config (could be moved to settings)
const REMINDERS = [
  { type: '20-20-20', interval: 20 * 60, message: '👀 Look away for 20 seconds at something 20 feet away!' },
  { type: 'hydration', interval: 45 * 60, message: '💧 Time for a sip of water. Stay hydrated!' },
  { type: 'stretch', interval: 60 * 60, message: '🧘‍♂️ Stand up and stretch for a minute.' },
];

const ReminderSystem: React.FC = () => {
  const { isActive, isPaused, isEnabled, testReminder, clearTestReminder } = useStudyTimer();
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: string; message: string }>({
    isOpen: false,
    type: '',
    message: ''
  });

  // Local session tracking
  const sessionTimeRef = useRef(0);

  // Handle Test Trigger
  useEffect(() => {
    if (testReminder) {
      setModalState({
        isOpen: true,
        type: testReminder.type,
        message: testReminder.message
      });
    }
  }, [testReminder]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && isEnabled) {
      interval = setInterval(() => {
        sessionTimeRef.current += 1;

        REMINDERS.forEach(reminder => {
          if (sessionTimeRef.current > 0 && sessionTimeRef.current % reminder.interval === 0) {
            triggerNotification(reminder);
          }
        });
      }, 1000);
    } else {
      // Reset session time on pause to ensure "continuous" focus for 20-20-20 rule
      sessionTimeRef.current = 0;
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, isEnabled]);

  const triggerNotification = (reminder: { type: string; message: string }) => {
    // 1. Try Native Notification first (if window is not focused)
    if (document.hidden && Notification.permission === 'granted') {
      new Notification('Study Focus', { body: reminder.message, icon: '/favicon.ico' });
    }

    // 2. Show Modal
    setModalState({
      isOpen: true,
      type: reminder.type,
      message: reminder.message
    });
  };

  const handleDismiss = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (testReminder) {
      clearTestReminder();
    }
  };

  return (
    <ReminderModal
      isOpen={modalState.isOpen}
      type={modalState.type}
      message={modalState.message}
      onDismiss={handleDismiss}
    />
  );
};

export default ReminderSystem;
