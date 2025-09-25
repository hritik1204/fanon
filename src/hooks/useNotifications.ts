import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { addNotificationResponseListener, setupNotificationChannels } from '@/src/utils/notifcation';

export const useNotifications = () => {
  const router = useRouter();

  useEffect(() => {
    let sub: any;

    const setupNotificationListener = async () => {
      // Set up notification channels first
      await setupNotificationChannels();
      
      // Set up notification response listener
      sub = await addNotificationResponseListener((response) => {
        const eventId = response.notification.request.content.data?.eventId;
        if (eventId) {
          router.push(`/event?id=${eventId}` as any);
        }
      });
    };

    setupNotificationListener();

    return () => {
      if (sub) {
        sub.remove();
      }
    };
  }, [router]);
};
