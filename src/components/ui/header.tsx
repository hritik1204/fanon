import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Colors } from "@/src/constants/theme";
import { horizontalScaleConversion } from "@/src/utils";

export const Header = ({ headerName }: { headerName: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{headerName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.main.p1,
    paddingHorizontal: horizontalScaleConversion(16),
    paddingVertical: horizontalScaleConversion(12),
  },
  text: {
    color: Colors.main.p2,
    fontSize: horizontalScaleConversion(24),
    fontWeight: "900",
  },
});
