
import React from "react";
import { Stack } from "expo-router";

const SettingLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: false,
      }}
    />
  );
};

export default SettingLayout;
