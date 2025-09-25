import React from "react";
import { Stack } from "expo-router";

const EventLayout = () => {
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

export default EventLayout;
