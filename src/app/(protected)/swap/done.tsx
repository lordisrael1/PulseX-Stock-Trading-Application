/**
 * SwapDoneScreen.tsx
 * Step 3 of 3 — Success confirmation after currency swap.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

type Direction = 'NGN_TO_USD' | 'USD_TO_NGN';

function StepBar() {
  const steps = ['Amount', 'Review', 'Done'] as const;
  return (
    <View style={styles.stepRow}>
      {steps.map((label, i) => (
        <View key={label} style={[styles.stepItem, i < steps.length - 1 && styles.stepItemFlex]}>
          <View style={styles.stepNodeWrap}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <Svg width={10} height={10} viewBox="0 0 24 24">
                <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
              </Svg>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelOn]}>{label}</Text>
          </View>
          {i < steps.length - 1 && <View style={[styles.stepLine, styles.stepLineDone]} />}
        </View>
      ))}
    </View>
  );
}

export default function SwapDoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; direction?: string; received?: string; ref?: string }>();

  const amount = parseFloat(params.amount ?? '20000');
  const received = parseFloat(params.received ?? '13.04');
  const direction = (params.direction as Direction) ?? 'NGN_TO_USD';
  const isNgnToUsd = direction === 'NGN_TO_USD';
  const ref = params.ref ?? `PX${Math.floor(Math.random() * 90000000 + 10000000)}`;

  const fromCfg = isNgnToUsd ? { code: 'NGN', symbol: '₦' } : { code: 'USD', symbol: '$' };
  const toCfg = isNgnToUsd ? { code: 'USD', symbol: '$' } : { code: 'NGN', symbol: '₦' };

  const fmt = (n: number) =>
    n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBackToWallet = () => {
    router.replace('/(protected)/(tabs)/wallet' as any);
  };

  const handleSwapAgain = () => {
    router.replace('/(protected)/swap' as any);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Swap complete</Text>
          <Text style={styles.topSub}>{fromCfg.code} → {toCfg.code}</Text>
        </View>
        <Text style={styles.topStep}>Step 3 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepBar />

        <Animated.View style={[styles.successWrap, { opacity, transform: [{ scale }] }]}>
          <View style={styles.successIcon}>
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={10} stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
              <Path d="M8 12l3 3 5-5" stroke="#1D4ED8" strokeWidth={2.2} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.successTitle}>Swap complete</Text>
          <Text style={styles.successSub}>
            {fromCfg.symbol}{fmt(amount)} {fromCfg.code} swapped for {toCfg.symbol}{fmt(received)} {toCfg.code}.
          </Text>
        </Animated.View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>You swapped</Text>
              <Text style={styles.summaryValue}>{fromCfg.symbol}{fmt(amount)}</Text>
              <Text style={styles.summaryCode}>{fromCfg.code}</Text>
            </View>
            <View style={styles.summaryArrow}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <View style={[styles.summaryCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.summaryLabel}>You received</Text>
              <Text style={[styles.summaryValue, { color: '#166634' }]}>{toCfg.symbol}{fmt(received)}</Text>
              <Text style={styles.summaryCode}>{toCfg.code}</Text>
            </View>
          </View>
        </View>

        <View style={styles.refWrap}>
          <Text style={styles.refTxt}>REF: {ref}</Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleBackToWallet} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Back to wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaGhost} onPress={handleSwapAgain} activeOpacity={0.75}>
          <Text style={styles.ctaGhostTxt}>Swap again</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE', gap: 10,
  },
  topCenter: { flex: 1 },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  topStep: { fontSize: 11, color: '#AAAAAA' },
  scroll: { paddingHorizontal: 18, paddingTop: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 22 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItemFlex: { flex: 1 },
  stepNodeWrap: { alignItems: 'center', gap: 4 },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#E8E8E8', marginTop: 11, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#1D4ED8' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#CCCCCC' },
  stepLabelOn: { color: '#1D4ED8' },

  successWrap: { alignItems: 'center', paddingVertical: 16, marginBottom: 18 },
  successIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A', marginBottom: 8, letterSpacing: -0.3 },
  successSub: { fontSize: 13, color: '#AAAAAA', textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },

  summaryCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1 },
  summaryArrow: { paddingHorizontal: 10 },
  summaryLabel: { fontSize: 10, color: '#AAAAAA', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '500', color: '#0A0A0A', letterSpacing: -0.4 },
  summaryCode: { fontSize: 10, color: '#999', marginTop: 2 },

  refWrap: { alignItems: 'center', paddingVertical: 10, marginBottom: 18 },
  refTxt: { fontSize: 11, color: '#AAAAAA', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  cta: { backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#E0E0E0' },
  ctaGhostTxt: { fontSize: 14, fontWeight: '600', color: '#888' },
});