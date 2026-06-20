import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BarChart2, BriefcaseBusiness, Home, User, Wallet } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
 
const { width } = Dimensions.get('window');
 
const ICONS = [Home, BriefcaseBusiness, Wallet, BarChart2, User];
const TAB_COUNT = 5;
 
type TabItemProps = {
  icon: React.ElementType;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
};
 
function TabItem({ icon: Icon, isActive, onPress, onLongPress }: TabItemProps) {
  // Scale for the pill container
  const pillScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  // Scale for the icon itself (pop on press)
  const iconScale = useRef(new Animated.Value(1)).current;
  // Opacity for inactive icon
  const iconOpacity = useRef(new Animated.Value(isActive ? 1 : 0.45)).current;
  // Vertical float
  const iconTranslateY = useRef(new Animated.Value(isActive ? -2 : 0)).current;
 
  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 12,
      }),
      Animated.spring(iconOpacity, {
        toValue: isActive ? 1 : 0.45,
        useNativeDriver: true,
        tension: 180,
        friction: 12,
      }),
      Animated.spring(iconTranslateY, {
        toValue: isActive ? -2 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 12,
      }),
    ]).start();
  }, [isActive]);
 
  const handlePress = () => {
    // Bounce the icon on press
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 0.82,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
    onPress();
  };
 
  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={1}
      style={styles.tabItem}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          {
            transform: [{ scale: pillScale }],
            opacity: pillScale,
          },
        ]}
      />
 
      {/* Icon */}
      <Animated.View
        style={{
          transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
          opacity: iconOpacity,
          zIndex: 10,
        }}
      >
        <Icon
          size={22}
          color={isActive ? '#FFFFFF' : '#A0A0A0'}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
 
export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
 
  return (
    <View style={[styles.outerWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.container}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const isFocused = state.index === index;
          const Icon = ICONS[index] ?? Home;
 
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
 
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
 
          return (
            <TabItem
              key={route.key}
              icon={Icon}
              isActive={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}
 
const PILL_SIZE = 48;
const CONTAINER_HEIGHT = 64;
 
const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    // No background — let the screen show through
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1C1C1E',
    borderRadius: 36,
    height: CONTAINER_HEIGHT,
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: 8,
    // Subtle border to lift from dark screens
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTAINER_HEIGHT,
  },
  activePill: {
    position: 'absolute',
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: PILL_SIZE / 2,
    backgroundColor: '#2C2C2E',
    // Inner glow
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
 
