/**
 * FundBrokerageReviewScreen.tsx
 * Step 2 of 3 — Review transfer before confirming.
 * Continues from FundBrokerageScreen.tsx (Step 1 — Amount).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type Exchange = 'US' | 'NGX';

const EXCHANGE_META = {
  US: {
    symbol: '$', currency: 'USD',
    walletLabel: 'USD Wallet', brokerLabel: 'US Brokerage',
    brokerSub: 'NYSE · NASDAQ',
    walletColor: '#1D4ED8', walletBg: '#EFF6FF',
    brokerColor: '#0F2419', brokerBg: '#E8F5E9',
    existingBP: 1240.00, walletBal: 29.14,
  },
  NGX: {
    symbol: '₦', currency: 'NGN',
    walletLabel: 'NGN Wallet', brokerLabel: 'NGX Brokerage',
    brokerSub: 'Nigerian Exchange',
    walletColor: '#1D4ED8', walletBg: '#EFF6FF',
    brokerColor: '#0F2419', brokerBg: '#E8F5E9',
    existingBP: 182340.00, walletBal: 44678.32,
  },
};

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

export default function FundBrokerageReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; exchange?: string }>();

  // In production: read from payment store instead of local params
  const amount = parseFloat(params.amount ?? '20');
  const exchange = (params.exchange as Exchange) ?? 'US';

  const [confirming, setConfirming] = useState(false);

  const m = EXCHANGE_META[exchange];
  const walletAfter = m.walletBal - amount;
  const newBP = m.existingBP + amount;

  const fmt = (n: number) =>
    n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      // TODO: call your fund-brokerage API
      // const res = await fundBrokerage({ amount, exchange });
      await new Promise(r => setTimeout(r, 1800));

      const ref = `PX${Math.floor(Math.random() * 90000000 + 10000000)}`;

      router.replace({
        pathname: '/(protected)/brokerage/FundBrokerageDone',
        params: { amount: String(amount), exchange, ref },
      } as any);
    } catch (e) {
      setConfirming(false);
    }
  };

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
          <Text style={styles.topTitle}>Review transfer</Text>
          <Text style={styles.topSub}>Wallet → Brokerage</Text>
        </View>
        <Text style={styles.topStep}>Step 2 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepBar active={2} />

        <View style={styles.amtHero}>
          <Text style={styles.amtDir}>TRANSFERRING TO BROKERAGE</Text>
          <Text style={styles.amtVal}>{m.symbol}{fmt(amount)}</Text>
          <Text style={styles.amtNote}>{m.brokerLabel} · {m.brokerSub}</Text>
        </View>

        <View style={styles.dashedRule}>
          <View style={styles.drLine} />
          <View style={styles.drCircle} />
          <View style={styles.drLine} />
        </View>

        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeNode}>
              <Text style={styles.routeDir}>FROM</Text>
              <View style={[styles.routeChip, { backgroundColor: m.walletBg }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M21 7H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"
                    stroke={m.walletColor} strokeWidth={1.8} fill="none" />
                  <Path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"
                    stroke={m.walletColor} strokeWidth={1.6} fill="none" />
                </Svg>
              </View>
              <Text style={styles.routeName}>{m.walletLabel}</Text>
            </View>

            <View style={styles.routeArrow}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M5 12h14M13 6l6 6-6 6" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>

            <View style={[styles.routeNode, { alignItems: 'flex-end' }]}>
              <Text style={[styles.routeDir, { color: '#2E7D32' }]}>TO</Text>
              <View style={[styles.routeChip, { backgroundColor: m.brokerBg }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M3 3v18h18" stroke={m.brokerColor} strokeWidth={1.8} strokeLinecap="round" fill="none" />
                  <Path d="M7 14l4-4 3 3 5-6" stroke={m.brokerColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </View>
              <Text style={[styles.routeName, { textAlign: 'right' }]}>{m.brokerLabel}</Text>
            </View>
          </View>

          <View style={styles.dBody}>
            <DetailRow label="Transfer amount" value={`${m.symbol}${fmt(amount)}`} />
            <DetailRow label="Transfer fee" value="Free" valueColor="#166634" />
            <DetailRow label="Settlement" value="Instant" />
            <DetailRow label="Wallet balance after" value={`${m.symbol}${fmt(walletAfter)}`} />
          </View>

          <View style={styles.bpRow}>
            <Text style={styles.bpLabel}>New buying power</Text>
            <Text style={styles.bpValue}>{m.symbol}{fmt(newBP)}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="#92400E" strokeWidth={1.8} fill="none" />
            <Path d="M12 8v4M12 16h.01" stroke="#92400E" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.infoTxt}>
            Funds transfer instantly to your buying power. You can start trading immediately after confirmation.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cta, confirming && styles.ctaDisabled]}
          onPress={handleConfirm}
          disabled={confirming}
          activeOpacity={0.85}
        >
          {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaTxt}>Confirm transfer</Text>}
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
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
  stepLineDone: { backgroundColor: '#0F2419' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepDotActive: {
    backgroundColor: '#0F2419', borderColor: '#0F2419',
    shadowColor: '#0F2419', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 5, elevation: 3,
  },
  stepDotTxt: { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.2 },
  stepLabelOn: { color: '#0F2419' },
  amtHero: { alignItems: 'center', paddingVertical: 20 },
  amtDir: { fontSize: 10, fontWeight: '700', color: '#CCCCCC', letterSpacing: 1.8, marginBottom: 10 },
  amtVal: { fontSize: 44, fontWeight: '500', color: '#0A0A0A', letterSpacing: -1.8 },
  amtNote: { fontSize: 12, color: '#AAAAAA', marginTop: 6 },
  dashedRule: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  drLine: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#E8E8E8' },
  drCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E4E4E4' },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden', marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  routeNode: { flex: 1, gap: 6 },
  routeDir: { fontSize: 9, fontWeight: '700', color: '#BBBBBB', letterSpacing: 1 },
  routeChip: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routeName: { fontSize: 12, fontWeight: '700', color: '#0A0A0A', marginTop: 2 },
  routeArrow: { paddingTop: 18, paddingHorizontal: 8 },
  dBody: { paddingHorizontal: 16, paddingVertical: 4 },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#F8F8F8' },
  dLabel: { fontSize: 12, color: '#AAAAAA' },
  dValue: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  bpRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, backgroundColor: '#F0FBF5', borderTopWidth: 0.5, borderTopColor: '#EBEBEB',
  },
  bpLabel: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  bpValue: { fontSize: 15, fontWeight: '800', color: '#166634' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: '#FFFBEB', borderRadius: 14, borderWidth: 0.5, borderColor: '#FDE68A',
    padding: 13, marginBottom: 18,
  },
  infoTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  cta: { backgroundColor: '#0A0A0A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  ctaDisabled: { opacity: 0.6 },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#E0E0E0' },
  ctaGhostTxt: { fontSize: 14, fontWeight: '600', color: '#888' },
});