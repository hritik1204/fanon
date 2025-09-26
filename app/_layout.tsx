// app/_layout.tsx (or wherever your RootLayout lives)
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/src/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as SplashScreen from "expo-splash-screen";
import { getLastNotificationResponseAsync } from "@/src/utils/notifcation";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
     
      if (!user) {
        setLoading(false);
        SplashScreen.hideAsync();
        if (pathname !== "/sign-in") router.replace("/sign-in");
        return;
      }

      // If we have an authenticated user, verify user profile exists in Firestore
      try {
        const uRef = doc(db, "users", user.uid);
        const snap = await getDoc(uRef);

        if (snap.exists()) {
          setLoading(false);
          SplashScreen.hideAsync();
          // if currently at sign-in, send them to home
          if (pathname === "/sign-in") router.replace("/(tabs)");

          // Handle cold-start notification deep link
          try {
            const response = await getLastNotificationResponseAsync();
            const eventId = response?.notification?.request?.content?.data?.eventId;
            if (eventId) {
              router.replace(`/event?id=${eventId}` as any);
              return;
            }
          } catch {}
        } else {
          // profile is missing in Firestore
          await signOut(auth);
          setLoading(false);
          SplashScreen.hideAsync();
          if (pathname !== "/sign-in") router.replace("/sign-in");
        }
      } catch (err) {
        console.warn("Error checking user profile:", err);

        try {
          await signOut(auth);
        } catch {
          // Ignore sign out errors
        }
        setLoading(false);
        SplashScreen.hideAsync();
        if (pathname !== "/sign-in") router.replace("/sign-in");
      }
    });

    return () => {
      mounted = false;
      unsub();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="event" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
