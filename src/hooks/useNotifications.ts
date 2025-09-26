// src/hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  setupNotificationChannels,
  addNotificationResponseListener,
} from "@/src/utils/notifcation";

export function useNotifications() {
  const router = useRouter();
  const lastHandledRef = useRef<{ id: string; at: number } | null>(null);
  const bootedRef = useRef(false);

  const handle = (resp?: Notifications.NotificationResponse | null) => {
    const eventId = resp?.notification?.request?.content?.data?.eventId as
      | string
      | undefined;
    if (!eventId) return;

    // de-dupe fast double fires
    const now = Date.now();
    const last = lastHandledRef.current;
    if (last && last.id === eventId && now - last.at < 2000) return;
    lastHandledRef.current = { id: eventId, at: now };

    // queue to avoid racing router mount
    queueMicrotask(() => router.replace(`/event?id=${eventId}` as any));
  };

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let runtimeSub: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      // safe to call repeatedly (no-op on iOS)
      await setupNotificationChannels();

      // ✅ cold start: app launched by tapping a notification
      const initial = await Notifications.getLastNotificationResponseAsync();
      if (!cancelled && initial) handle(initial);

      // ✅ taps while app is foreground/background
      runtimeSub = await addNotificationResponseListener((resp) => handle(resp));
    })();

    return () => {
      cancelled = true;
      runtimeSub?.remove?.();
    };
  }, [router]);
}
