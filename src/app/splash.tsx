/**
 * SplashScreen.tsx
 * ---------------------------------------------------------------------
 * Lightweight splash screen with a quick launch animation and auth routing.
 *
 * Behavior:
 * 1. Logo scales in and fades up.
 * 2. Wordmark and loading dots appear.
 * 3. After a brief hold, the logo expands and fades away.
 * 4. Navigate to auth or protected route depending on the saved token.
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { storage } from '../lib/storage';

const SPLASH_HOLD_MS = 1600;

async function determineInitialRoute() {
  const token = await storage.getString('accessToken');
  return token ? '/(protected)/(tabs)' : '/(auth)/login';
}

function AnimatedLogo({
  scale,
  opacity,
}: {
  scale: Animated.Value;
  opacity: Animated.Value;
}) {
  return (
    <Animated.View style={[splashStyles.logoWrap, { transform: [{ scale }], opacity }]}> 
      <View style={splashStyles.iconBox}>
        <Svg width={44} height={44} viewBox="0 0 24 24">
          <Path
            d="M3 17l4-8 4 4 4-6 4 10"
            stroke="#4ADE80"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

function LoadingDots({ opacity }: { opacity: Animated.Value }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      );

    animateDot(dot1, 0).start();
    animateDot(dot2, 120).start();
    animateDot(dot3, 240).start();
  }, []);

  return (
    <Animated.View style={[splashStyles.dotsRow, { opacity }]}> 
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View key={index} style={[splashStyles.dot, { opacity: dot }]} />
      ))}
    </Animated.View>
  );
}

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const startAnimation = () => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(wordmarkOpacity, {
            toValue: 1,
            duration: 280,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(dotsOpacity, {
            toValue: 1,
            duration: 200,
            delay: 350,
            useNativeDriver: true,
          }),
        ]).start();

        timeoutId = setTimeout(async () => {
          const targetRoute = await determineInitialRoute();

          Animated.parallel([
            Animated.timing(logoScale, {
              toValue: 8,
              duration: 480,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
              toValue: 0,
              duration: 380,
              delay: 80,
              useNativeDriver: true,
            }),
            Animated.timing(wordmarkOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(dotsOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.replace(targetRoute as any);
          });
        }, SPLASH_HOLD_MS);
      });
    };

    startAnimation();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return (
    <View style={splashStyles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={Platform.OS === 'android'}
      />

      <View style={splashStyles.bgGrid} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} style={splashStyles.bgGridLine} />
        ))}
      </View>

      <View style={splashStyles.center}>
        <AnimatedLogo scale={logoScale} opacity={logoOpacity} />

        <Animated.View style={[splashStyles.wordmarkWrap, { opacity: wordmarkOpacity }]}> 
          <Text style={splashStyles.wordmark}>PulseX</Text>
          <Text style={splashStyles.wordmarkSub}>Markets. Simplified.</Text>
        </Animated.View>
      </View>

      <View style={splashStyles.bottom}>
        <LoadingDots opacity={dotsOpacity} />
        <Animated.Text style={[splashStyles.fromTxt, { opacity: dotsOpacity }]}>Invest Now, Secure Your future</Animated.Text>
      </View>

      <Animated.View style={[splashStyles.cornerBadge, { opacity: wordmarkOpacity }]}> 
        <View style={splashStyles.cornerDot} />
        <Text style={splashStyles.cornerTxt}>CBN Regulated</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bgGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    opacity: 0.04,
  },
  bgGridLine: {
    height: 1,
    backgroundColor: '#0A0A0A',
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#0F2419',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F2419',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  wordmarkWrap: {
    alignItems: 'center',
    gap: 4,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -1.2,
  },
  wordmarkSub: {
    fontSize: 13,
    color: '#AAAAAA',
    letterSpacing: 0.5,
  },

  bottom: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 40,
    alignItems: 'center',
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F2419',
  },
  fromTxt: {
    fontSize: 11,
    color: '#CCCCCC',
    letterSpacing: 0.3,
  },

  cornerBadge: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 40,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.5,
  },
  cornerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  cornerTxt: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
});