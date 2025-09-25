import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { addNotificationResponseListener } from '@/src/utils/notifcation';

export const useNotifications = () => {
  const router = useRouter();

  useEffect(() => {
    let sub: any;

    const setupNotificationListener = async () => {
      sub = await addNotificationResponseListener((response) => {
        const eventId = response.notification.request.content.data?.eventId;
        if (eventId) {
          router.push(`/event/${eventId}` as any);
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
