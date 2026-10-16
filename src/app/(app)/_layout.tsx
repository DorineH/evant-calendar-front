import React from "react";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-channel" options={{ presentation: "modal" }} />
      <Stack.Screen name="join-channel" options={{ presentation: "modal" }} />
    </Stack>
  );
}
