import { Stack } from 'expo-router';

export default function SwapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',   // sheet-style entry
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    />
  );
}