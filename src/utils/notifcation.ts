// src/utils/notifications.ts
import Constants from "expo-constants";
import { Alert, Platform } from "react-native";
import * as Device from "expo-device";

// Dynamically load expo-notifications only if available
let Notifications: typeof import("expo-notifications") | null = null;

async function loadNotifications() {
  if (!Notifications && Constants.appOwnership !== "expo") {
    Notifications = await import("expo-notifications");
  }
  return Notifications;
}

export async function setupNotificationChannels() {
  const N = await loadNotifications();
  if (!N) return;

  // Set up notification channel for Android
  await N.setNotificationChannelAsync('default', {
    name: 'Event Reminders',
    description: 'Notifications for upcoming events',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B82F6',
  });
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
    Alert.alert(
      "Reminder",
      "Can't schedule local notification in Expo Go. Use dev-client."
    );
    return;
  }

  // Validate event data
  if (!event || !event.startTime || !event.id || !event.title) {
    Alert.alert("Error", "Invalid event data for notification scheduling.");
    return;
  }

  // Convert startTime to Date
  let eventDate: Date;
  if (event.startTime.seconds && typeof event.startTime.seconds === "number") {
    eventDate = new Date(event.startTime.seconds * 1000);
  } else if (event.startTime.toDate) {
    eventDate = event.startTime.toDate();
  } else {
    eventDate = new Date(event.startTime);
  }

  // Check if event is in the future
  if (eventDate <= new Date()) {
    Alert.alert("Cannot Schedule", "Event has already started or ended.");
    return;
  }

  // Trigger exactly at the event start time
  const trigger: import("expo-notifications").DateTriggerInput = {
    type: N.SchedulableTriggerInputTypes.DATE,
    date: eventDate,
  };

  try {
    const notificationId = await N.scheduleNotificationAsync({
      content: {
        title: `${event.title} is starting now 🎉`,
        body: `Tap to join the event.`,
        data: { eventId: event.id },
        sound: "default",
        priority: N.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    Alert.alert(
      "Reminder Set",
      `You'll be notified when "${event.title}" starts.`
    );
    return notificationId;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    Alert.alert("Error", "Failed to schedule notification. Please try again.");
  }
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



export async function requestNotificationPermission() {
  const N = await loadNotifications();
  if (!N) return false;

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permission needed",
      "Enable notifications in settings to get reminders."
    );
    return false;
  }

  // Android channel setup
  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Default",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
}



export async function getLastNotificationResponseAsync() {
  const N = await loadNotifications();
  if (!N) return null;

  try {
    const response = await N.getLastNotificationResponseAsync();
    return response ?? null;
  } catch (err) {
    console.warn("getLastNotificationResponseAsync failed:", err);
    return null;
  }
}

