import { Tabs } from "expo-router";
import React from "react";


import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Colors } from "@/src/constants/theme";
import { horizontalScaleConversion } from "@/src";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.main.p2,
        headerShown: false,
        // tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.main.p1,
          paddingTop: 16,
          height: horizontalScaleConversion(90),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
