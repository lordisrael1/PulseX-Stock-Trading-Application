/**
 * FundBrokerageDoneScreen.tsx
 * Step 3 of 3 — Success confirmation after transferring wallet funds to brokerage.
 * Final screen in the Fund Brokerage flow.
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

type Exchange = 'US' | 'NGX';

const EXCHANGE_META = {
  US: {
    symbol: '$',
    walletLabel: 'USD Wallet',
    brokerLabel: 'US Brokerage',
    brokerSub: 'NYSE · NASDAQ',
    existingBP: 1240.00,
    walletBal: 29.14,
  },
  NGX: {
    symbol: '₦',
    walletLabel: 'NGN Wallet',
    brokerLabel: 'NGX Brokerage',
    brokerSub: 'Nigerian Exchange',
    existingBP: 182340.00,
    walletBal: 44678.32,
  },
};

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

export default function FundBrokerageDoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; exchange?: string; ref?: string }>();

  const amount = parseFloat(params.amount ?? '20');
  const exchange = (params.exchange as Exchange) ?? 'US';
  const ref = params.ref ?? `PX${Math.floor(Math.random() * 90000000 + 10000000)}`;

  const m = EXCHANGE_META[exchange];
  const walletAfter = m.walletBal - amount;
  const newBP = m.existingBP + amount;

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

  const handleBackHome = () => {
    // Clears the fund-brokerage stack and returns to brokerage screen
    router.replace('/(protected)/brokerage' as any);
  };

  const handleStartTrading = () => {
    router.replace({
      pathname: '/(protected)/(tabs)',
      params: { exchange },
    } as any);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Transfer complete</Text>
          <Text style={styles.topSub}>Funds added to brokerage</Text>
        </View>
        <Text style={styles.topStep}>Step 3 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepBar />

        <Animated.View style={[styles.successWrap, { opacity, transform: [{ scale }] }]}>
          <View style={styles.successIcon}>
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={10} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
              <Path d="M8 12l3 3 5-5" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.successTitle}>Transfer complete</Text>
          <Text style={styles.successSub}>
            {m.symbol}{fmt(amount)} added to your {m.brokerLabel.toLowerCase()} buying power.
          </Text>
        </Animated.View>

        {/* Updated balances */}
        <View style={styles.balRow}>
          <View style={styles.balCard}>
            <Text style={styles.balLabel}>Wallet balance</Text>
            <Text style={styles.balValue}>{m.symbol}{fmt(walletAfter)}</Text>
            <Text style={styles.balDiffMinus}>-{m.symbol}{fmt(amount)}</Text>
          </View>
          <View style={[styles.balCard, styles.balCardGreen]}>
            <Text style={[styles.balLabel, { color: '#4CAF50' }]}>Buying power</Text>
            <Text style={[styles.balValue, { color: '#0F2419' }]}>{m.symbol}{fmt(newBP)}</Text>
            <Text style={styles.balDiffPlus}>+{m.symbol}{fmt(amount)}</Text>
          </View>
        </View>

        {/* Reference */}
        <View style={styles.refWrap}>
          <Text style={styles.refTxt}>REF: {ref}</Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleStartTrading} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Start trading ↗</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaGhost} onPress={handleBackHome} activeOpacity={0.75}>
          <Text style={styles.ctaGhostTxt}>Back to brokerage</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
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
  stepLineDone: { backgroundColor: '#0F2419' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.2 },
  stepLabelOn: { color: '#0F2419' },

  successWrap: { alignItems: 'center', paddingVertical: 16, marginBottom: 18 },
  successIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A', marginBottom: 8, letterSpacing: -0.3 },
  successSub: { fontSize: 13, color: '#AAAAAA', textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },

  balRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  balCard: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#E8E8E8', padding: 12,
  },
  balCardGreen: { backgroundColor: '#F0FBF5', borderColor: '#A5D6A7' },
  balLabel: { fontSize: 10, color: '#AAAAAA', marginBottom: 6 },
  balValue: { fontSize: 17, fontWeight: '500', color: '#0A0A0A', letterSpacing: -0.3 },
  balDiffMinus: { fontSize: 10, color: '#DC2626', marginTop: 3 },
  balDiffPlus: { fontSize: 10, color: '#166634', marginTop: 3 },

  refWrap: { alignItems: 'center', paddingVertical: 10, marginBottom: 18 },
  refTxt: {
    fontSize: 11, color: '#AAAAAA',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  cta: { backgroundColor: '#0F2419', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#E0E0E0' },
  ctaGhostTxt: { fontSize: 14, fontWeight: '600', color: '#888' },
});