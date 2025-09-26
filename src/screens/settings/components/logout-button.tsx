import { Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { horizontalScaleConversion } from "@/src/utils";
import { Colors } from "@/src/constants/theme";
import { doSignOut } from "@/src/auth";
import { router } from "expo-router";

const LogoutButton = () => {
  async function handleSignOut() {
    try {
      await doSignOut();
      router.replace("/sign-in"); // send user back to sign-in
    } catch (e) {
      console.warn("Sign-out failed", e);
    }
  }
  return (
    <TouchableOpacity
      style={[styles.btn]}
      onPress={handleSignOut}
      // disabled={seeding}
    >
      <Text style={{ color: "white" }}>{"logout"}</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  btn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: horizontalScaleConversion(12),
    paddingVertical: horizontalScaleConversion(8),
    borderRadius: 6,
    marginHorizontal: horizontalScaleConversion(16),
    marginTop: horizontalScaleConversion(16),
    alignSelf: "flex-start",

  },
});
