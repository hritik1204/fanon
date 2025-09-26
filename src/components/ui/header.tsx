import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Colors } from "@/src/constants/theme";
import { horizontalScaleConversion } from "@/src/utils";

import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

export const Header = ({
  headerName,
  showBackButton = true,
  showSettingsButton = false,
}: {
  headerName: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
}) => {

  const handleBackPress = () => {
    if(router.canGoBack()) {
      router.back()
    } else {
      router.replace("/")
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="arrow-left" size={24} color={Colors.main.p2} />
          </TouchableOpacity>
        )}
        <Text style={styles.text}>{headerName}</Text>
      </View>
      {showSettingsButton && (
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Feather name="settings" size={24} color={Colors.main.p2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.main.p1,
    paddingHorizontal: horizontalScaleConversion(16),
    paddingVertical: horizontalScaleConversion(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // justifyContent: "space-between",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScaleConversion(8),
  },
  text: {
    color: Colors.main.p2,
    fontSize: horizontalScaleConversion(24),
    fontWeight: "900",
  },
});
