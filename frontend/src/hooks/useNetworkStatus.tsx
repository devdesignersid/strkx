import { useEffect } from 'react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { Wifi, WifiOff } from 'lucide-react';

export function useNetworkStatus() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success(TOAST_MESSAGES.GENERAL.NETWORK_RESTORED, {
        icon: <Wifi className="w-4 h-4" />,
        duration: 3000,
      });
    };

    const handleOffline = () => {
      toast.error(TOAST_MESSAGES.GENERAL.NETWORK_ERROR, {
        icon: <WifiOff className="w-4 h-4" />,
        duration: Infinity, // Keep visible until online
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
