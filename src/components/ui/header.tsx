import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { Colors } from "@/src/constants/theme";
import { horizontalScaleConversion } from "@/src/utils";

import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

export const Header = ({ headerName, showBackButton = true }: { headerName: string, showBackButton?: boolean }) => {
  return (
    <View style={styles.container}>
      {showBackButton && <TouchableOpacity onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color={Colors.main.p2} />
      </TouchableOpacity>}
      <Text style={styles.text}>{headerName}</Text>
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
    gap: horizontalScaleConversion(8),
    // justifyContent: "space-between",
  },
  text: {
    color: Colors.main.p2,
    fontSize: horizontalScaleConversion(24),
    fontWeight: "900",
  },
});
