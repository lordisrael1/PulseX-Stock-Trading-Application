import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { storage } from "../lib/storage";

export default function SplashScreen() {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await storage.getString(
      "accessToken"
    );

    if (token) {
      router.replace(
        "/(protected)/(tabs)"
      );
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Loading...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}