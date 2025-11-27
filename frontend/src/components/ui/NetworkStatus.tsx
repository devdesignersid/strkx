import { useEffect } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('You are back online!', {
        icon: <Wifi className="w-4 h-4" />,
        duration: 3000,
      });
    };

    const handleOffline = () => {
      toast.error('You are offline. Check your connection.', {
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

  return null; // Headless component
}
