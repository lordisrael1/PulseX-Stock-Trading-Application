/**
 * SwapReviewScreen.tsx
 * Step 2 of 3 — Review swap with locked rate before confirming.
 * Continues from SwapAmountScreen.tsx.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type Direction = 'NGN_TO_USD' | 'USD_TO_NGN';

const RATE = 1533.20;
const SPREAD = 0.3;

function StepBar({ active }: { active: 1 | 2 | 3 }) {
  const steps = ['Amount', 'Review', 'Done'] as const;
  return (
    <View style={styles.stepRow}>
      {steps.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3;
        const isDone = idx < active;
        const isCur = idx === active;
        return (
          <View key={label} style={[styles.stepItem, i < steps.length - 1 && styles.stepItemFlex]}>
            <View style={styles.stepNodeWrap}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isCur && styles.stepDotActive]}>
                {isDone ? (
                  <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                  </Svg>
                ) : (
                  <Text style={[styles.stepDotTxt, (isDone || isCur) && { color: '#fff' }]}>{idx}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, (isDone || isCur) && styles.stepLabelOn]}>{label}</Text>
            </View>
            {i < steps.length - 1 && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
          </View>
        );
      })}
    </View>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={[styles.dValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

export default function SwapReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; direction?: string }>();

  const amount = parseFloat(params.amount ?? '20000');
  const direction = (params.direction as Direction) ?? 'NGN_TO_USD';
  const isNgnToUsd = direction === 'NGN_TO_USD';

  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(30); // rate lock countdown

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fromCfg = isNgnToUsd
    ? { code: 'NGN', symbol: '₦', color: '#2E7D32', bg: '#E8F5E9' }
    : { code: 'USD', symbol: '$', color: '#1D4ED8', bg: '#EFF6FF' };

  const toCfg = isNgnToUsd
    ? { code: 'USD', symbol: '$', color: '#1D4ED8', bg: '#EFF6FF' }
    : { code: 'NGN', symbol: '₦', color: '#2E7D32', bg: '#E8F5E9' };

  const effectiveRate = RATE * (1 + SPREAD / 100);
  const receiveAmount = isNgnToUsd
    ? amount / effectiveRate
    : amount * (RATE * (1 - SPREAD / 100));

  const fee = isNgnToUsd ? amount * 0 : 0; // fee-free FX, spread is the cost

  const fmt = (n: number, decimals = 2) =>
    n.toLocaleString('en-NG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const handleConfirm = async () => {
    if (countdown <= 0) {
      // Rate expired — reset countdown instead of confirming stale rate
      setCountdown(30);
      return;
    }
    setConfirming(true);
    try {
      // TODO: call your swap API
      // const res = await swapCurrency({ amount, direction, lockedRate: effectiveRate });
      await new Promise(r => setTimeout(r, 1600));

      const ref = `PX${Math.floor(Math.random() * 90000000 + 10000000)}`;

      router.replace({
        pathname: '/(protected)/swap/done',
        params: {
          amount: String(amount),
          direction,
          received: String(receiveAmount),
          ref,
        },
      } as any);
    } catch (e) {
      setConfirming(false);
    }
  };

  const rateExpiring = countdown <= 10;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7} disabled={confirming}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Review swap</Text>
          <Text style={styles.topSub}>{fromCfg.code} → {toCfg.code}</Text>
        </View>
        <Text style={styles.topStep}>Step 2 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepBar active={2} />

        {/* Amount hero */}
        <View style={styles.amtHero}>
          <Text style={styles.amtDir}>YOU SWAP</Text>
          <Text style={styles.amtVal}>{fromCfg.symbol}{fmt(amount)}</Text>
          <View style={styles.arrowDown}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path d="M12 5v14M5 12l7 7 7-7" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.amtDir}>YOU RECEIVE</Text>
          <Text style={[styles.amtVal, { color: toCfg.color, fontSize: 36 }]}>
            {toCfg.symbol}{fmt(receiveAmount)}
          </Text>
        </View>

        {/* Rate lock countdown */}
        <View style={[styles.lockBox, rateExpiring && styles.lockBoxWarn]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
              stroke={rateExpiring ? '#92400E' : '#1D4ED8'} strokeWidth={1.8} fill="none" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke={rateExpiring ? '#92400E' : '#1D4ED8'} strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={[styles.lockTxt, rateExpiring && { color: '#92400E' }]}>
            Rate locked for {countdown}s
          </Text>
          <Text style={[styles.lockRate, rateExpiring && { color: '#92400E' }]}>
            1 USD = ₦{effectiveRate.toFixed(2)}
          </Text>
        </View>

        {/* Detail card */}
        <View style={styles.card}>
          <View style={styles.dBody}>
            <DetailRow label="You swap" value={`${fromCfg.symbol}${fmt(amount)}`} />
            <DetailRow label="Exchange rate" value={`1 USD = ₦${effectiveRate.toFixed(2)}`} />
            <DetailRow label="Spread" value={`${SPREAD}%`} />
            <DetailRow label="Swap fee" value="Free" valueColor="#166634" />
            <DetailRow label="Settlement" value="Instant" />
          </View>
          <View style={styles.receiveRow}>
            <Text style={styles.receiveLabel}>You receive</Text>
            <Text style={styles.receiveValue}>{toCfg.symbol}{fmt(receiveAmount)}</Text>
          </View>
        </View>

        {/* Info notice */}
        <View style={styles.infoBox}>
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="#92400E" strokeWidth={1.8} fill="none" />
            <Path d="M12 8v4M12 16h.01" stroke="#92400E" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.infoTxt}>
            This rate is locked for 30 seconds. If it expires before you confirm, you'll need to re-preview at the latest rate.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cta, confirming && styles.ctaDisabled]}
          onPress={handleConfirm}
          disabled={confirming}
          activeOpacity={0.85}
        >
          {confirming
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaTxt}>
                {countdown <= 0 ? 'Refresh rate' : 'Confirm swap'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaGhost, confirming && { opacity: 0.5 }]}
          onPress={() => router.back()}
          disabled={confirming}
          activeOpacity={0.75}
        >
          <Text style={styles.ctaGhostTxt}>Edit amount</Text>
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
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
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
  stepDotActive: {
    backgroundColor: '#1D4ED8', borderColor: '#1D4ED8',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3,
  },
  stepDotTxt: { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#CCCCCC' },
  stepLabelOn: { color: '#1D4ED8' },

  amtHero: { alignItems: 'center', paddingVertical: 16, marginBottom: 14 },
  amtDir: { fontSize: 10, fontWeight: '700', color: '#CCCCCC', letterSpacing: 1.8, marginBottom: 8 },
  amtVal: { fontSize: 32, fontWeight: '500', color: '#0A0A0A', letterSpacing: -1 },
  arrowDown: { paddingVertical: 10 },

  lockBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 0.5, borderColor: '#BFDBFE',
    padding: 11, marginBottom: 16,
  },
  lockBoxWarn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  lockTxt: { fontSize: 12, fontWeight: '600', color: '#1D4ED8', flex: 1 },
  lockRate: { fontSize: 11, color: '#1D4ED8' },

  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden', marginBottom: 14 },
  dBody: { paddingHorizontal: 16, paddingVertical: 6 },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#F8F8F8' },
  dLabel: { fontSize: 12, color: '#AAAAAA' },
  dValue: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  receiveRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, backgroundColor: '#F0FBF5', borderTopWidth: 0.5, borderTopColor: '#EBEBEB',
  },
  receiveLabel: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  receiveValue: { fontSize: 16, fontWeight: '800', color: '#166634' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: '#FFFBEB', borderRadius: 14, borderWidth: 0.5, borderColor: '#FDE68A',
    padding: 13, marginBottom: 18,
  },
  infoTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  cta: { backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  ctaDisabled: { opacity: 0.6 },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#E0E0E0' },
  ctaGhostTxt: { fontSize: 14, fontWeight: '600', color: '#888' },
});