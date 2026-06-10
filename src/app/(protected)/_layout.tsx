import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Redirect href="/(auth)/login" />
    );
  }

  return <Slot />;
}