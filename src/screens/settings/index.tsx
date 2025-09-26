import { StyleSheet, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/ui/header";
import { Colors } from "@/src/constants/theme";
import LogoutButton from "./components/logout-button";
import { useUserProfile } from "@/src/hooks/useUserProfile";

const SettingsScreen = () => {
  const { userProfile } = useUserProfile();
  return (
    <SafeAreaView style={styles.container}>
      <Header headerName="Settings" showBackButton={true} />
      <Text style={styles.emailText}>Email: {userProfile?.email ?? "Guest"}</Text>
      <LogoutButton />
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.main.p1,
  },
  emailText: {
    color: Colors.main.p2,
    marginTop: 16,
    marginHorizontal: 16,
  },
});
