import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../../../components/AnimatedTabBar';
 
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="portfolio" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
 