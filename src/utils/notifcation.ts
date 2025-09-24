// src/utils/notifications.ts
import Constants from "expo-constants";
import { Alert } from "react-native";
import * as Device from "expo-device";

// Dynamically load expo-notifications only if available
let Notifications: typeof import("expo-notifications") | null = null;

async function loadNotifications() {
  if (!Notifications && Constants.appOwnership !== "expo") {
    Notifications = await import("expo-notifications");
  }
  return Notifications;
}

export async function getPushTokenIfAvailableAsync() {
  const N = await loadNotifications();
  if (!N) return null;

  const { status: existing } = await N.getPermissionsAsync();
  if (existing !== "granted") {
    const { status } = await N.requestPermissionsAsync();
    if (status !== "granted") return null;
  }
  if (Device.isDevice) {
    const tokenData = await N.getExpoPushTokenAsync();
    return tokenData.data;
  }
  return null;
}

export async function scheduleLocalNotification(event: any) {
  const N = await loadNotifications();
  if (!N) {
    Alert.alert("Reminder", "Can't schedule local notification in Expo Go. Use dev-client.");
    return;
  }
  const dateType = (N.SchedulableTriggerInputTypes.DATE as unknown) as import("expo-notifications").SchedulableTriggerInputTypes.DATE;
  const trigger: import("expo-notifications").DateTriggerInput = {
    type: dateType,
    date: new Date(event.startTime.seconds * 1000)
  };
  return await N.scheduleNotificationAsync({
    content: {
      title: `${event.title} starting`,
      body: `${event.type} is starting now — open app to join.`,
      data: { eventId: event.id }
    },
    trigger
  });
}

export async function addNotificationResponseListener(
    callback: (response: import("expo-notifications").NotificationResponse) => void
  ) {
    const N = await loadNotifications();
    if (!N) {
      console.warn("expo-notifications not available (Expo Go on Android)");
      return { remove: () => {} }; // no-op
    }
    return N.addNotificationResponseReceivedListener(callback);
  }
  

export async function cancelNotification(id: string) {
  const N = await loadNotifications();
  if (N) await N.cancelScheduledNotificationAsync(id);
}
