// app/_layout.tsx
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/src/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as SplashScreen from "expo-splash-screen";
import { useNotifications } from "@/src/hooks/useNotifications";

// Prevent splash from auto-hiding before setup
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Mount global notifications handler (cold start + runtime taps)
  useNotifications();

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

    try {
      const uRef = doc(db, "users", user.uid);
      const snap = await getDoc(uRef);

      if (snap.exists()) {
        setLoading(false);
        SplashScreen.hideAsync();
        if (pathname === "/sign-in") router.replace("/(tabs)");
      } else {
        await signOut(auth);
        setLoading(false);
        SplashScreen.hideAsync();
        if (pathname !== "/sign-in") router.replace("/sign-in");
      }
    } catch {
      try { await signOut(auth); } catch {}
      setLoading(false);
      SplashScreen.hideAsync();
      if (pathname !== "/sign-in") router.replace("/sign-in");
    }
  });

  return () => {
    mounted = false;
    unsub();
  };
// ✅ only run once on mount
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []); 


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
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="event" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
