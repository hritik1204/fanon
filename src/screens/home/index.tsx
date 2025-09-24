import React from "react";
import { Header } from "@/src/components/ui/header";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeBody } from "./components";
import { StyleSheet } from "react-native";

const HomeScreen = () => {
  return (
    <SafeAreaView style={[styles.container]} edges={["top"]}>
      <Header headerName="FANON" />
      <HomeBody />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
