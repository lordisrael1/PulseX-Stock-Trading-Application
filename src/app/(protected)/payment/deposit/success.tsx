/**
 * PaymentSuccessScreen.tsx
 * Shown immediately after the user confirms payment.
 * Status: Pending → resolves to Success after wallet credit.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

function fmt(n: number): string {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Animated checkmark / pending ring ───────────────────────────────────────

function StatusIcon({ confirmed }: { confirmed: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Entrance
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Spinning ring for pending
  useEffect(() => {
    if (!confirmed) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [confirmed]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[si.wrap, { opacity, transform: [{ scale }] }]}>
      {/* Background circle */}
      <View style={si.outerRing} />

      {/* Spinning arc (pending only) */}
      {!confirmed && (
        <Animated.View style={[si.spinnerWrap, { transform: [{ rotate: spin }] }]}>
          <Svg width={84} height={84} viewBox="0 0 84 84">
            <Circle
              cx={42} cy={42} r={34}
              stroke="#111"
              strokeWidth={3.5}
              strokeDasharray="60 150"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      )}

      {/* Icon */}
      <View style={[si.iconBox, confirmed && si.iconBoxDone]}>
        {confirmed ? (
          <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
            <Path
              d="M7 16.5l6 6L25 10"
              stroke="#fff"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
            <Path d="M16 9v7l4.5 4.5" stroke="#111" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={16} cy={16} r={12} stroke="#111" strokeWidth={2} fill="none" />
          </Svg>
        )}
      </View>
    </Animated.View>
  );
}

const si = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: 84, height: 84 },
  outerRing: {
    position: 'absolute',
    width: 84, height: 84,
    borderRadius: 42,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  spinnerWrap: { position: 'absolute', width: 84, height: 84 },
  iconBox: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDone: { backgroundColor: '#111' },
});

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={pd.wrap}>
      <Animated.View style={[pd.ring, { transform: [{ scale }], opacity }]} />
      <View style={pd.dot} />
    </View>
  );
}

const pd = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: 12, height: 12 },
  ring: {
    position: 'absolute',
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#FFB020',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#F59E0B' },
});

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={[ir.value, mono && ir.valueMono]}>{value}</Text>
    </View>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  label: { fontSize: 13, color: '#888' },
  value: { fontSize: 13, fontWeight: '600', color: '#111' },
  valueMono: { letterSpacing: 0.5, fontSize: 12, color: '#555' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; bankName?: string; last4?: string }>();

  const amount = Number.isFinite(Number(params.amount))
    ? Math.max(0, parseInt(params.amount ?? '', 10))
    : 10000;
  const bankName = params.bankName ?? 'Guaranty Trust Bank';
  const last4 = params.last4 ?? '6789';
  const reference = 'PXW-20241038-7K2M';

  const [confirmed, setConfirmed] = useState(false);
  const slideUp = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const fee = Math.min(amount * 0.01, 2000);
  const total = amount + fee;

  // Slide content in
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 10, delay: 200, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  // Simulate webhook confirmation after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setConfirmed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── Status hero ── */}
        <View style={styles.hero}>
          <StatusIcon confirmed={confirmed} />

          <Animated.View style={[styles.statusBlock, { opacity: contentOpacity, transform: [{ translateY: slideUp }] }]}>

            {/* Status badge */}
            <View style={[styles.statusBadge, confirmed ? styles.statusBadgeDone : styles.statusBadgePending]}>
              {!confirmed && <PulseDot />}
              {confirmed && (
                <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                  <Path d="M2 5l2 2 4-4" stroke="#16A34A" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
              <Text style={[styles.statusBadgeTxt, confirmed ? { color: '#16A34A' } : { color: '#B45309' }]}>
                {confirmed ? 'Credited' : 'Pending'}
              </Text>
            </View>

            <Text style={styles.heroAmount}>₦{fmt(total)}</Text>

            <Text style={styles.heroTitle}>
              {confirmed ? 'Payment successful' : 'Payment is processing'}
            </Text>
            <Text style={styles.heroSub}>
              {confirmed
                ? 'Your PulseX wallet has been credited.'
                : 'We received your payment. Your wallet\nwill be credited in a moment.'}
            </Text>
          </Animated.View>
        </View>

        {/* ── Details card ── */}
        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: slideUp }] }}>

          <Text style={styles.sectionLabel}>TRANSACTION DETAILS</Text>
          <View style={styles.card}>
            <InfoRow label="Amount funded" value={`₦${fmt(amount)}`} />
            <InfoRow label="Processing fee" value={fee === 0 ? 'Free' : `₦${fmt(fee)}`} />
            <InfoRow label="Total debited" value={`₦${fmt(total)}`} />
            <InfoRow label="From" value={`${bankName} .... ${last4}`} />
            <InfoRow label="To" value="PulseX Wallet" />
            <InfoRow label="Date" value={`${dateStr} · ${timeStr}`} />
            <InfoRow label="Reference" value={reference} mono />
          </View>

          {/* ── What's next ── */}
          <Text style={styles.sectionLabel}>WHAT'S NEXT</Text>
          <View style={styles.card}>

            {[
              {
                icon: (
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <Path d="M9 1v2M9 15v2M1 9h2M15 9h2" stroke="#111" strokeWidth={1.4} strokeLinecap="round" />
                    <Circle cx={9} cy={9} r={4.5} stroke="#111" strokeWidth={1.4} />
                  </Svg>
                ),
                title: 'Check your wallet',
                sub: confirmed ? 'Your balance has been updated.' : 'Balance updates within seconds.',
              },
              {
                icon: (
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <Path d="M3 9l4 4 8-8" stroke="#111" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={9} cy={9} r={8} stroke="#111" strokeWidth={1.4} fill="none" />
                  </Svg>
                ),
                title: 'Start investing',
                sub: 'Buy stocks on NGX or US markets.',
              },
              {
                icon: (
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <Path d="M9 4v5l3 3" stroke="#111" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={9} cy={9} r={8} stroke="#111" strokeWidth={1.4} fill="none" />
                  </Svg>
                ),
                title: 'View transaction history',
                sub: 'Track all activity in your statements.',
              },
            ].map((item, i) => (
              <View key={i} style={[styles.nextRow, i < 2 && styles.nextRowBorder]}>
                <View style={styles.nextIcon}>{item.icon}</View>
                <View style={styles.nextText}>
                  <Text style={styles.nextTitle}>{item.title}</Text>
                  <Text style={styles.nextSub}>{item.sub}</Text>
                </View>
                <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <Path d="M5 3l4 4-4 4" stroke="#CCC" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            ))}
          </View>

          {/* ── Support ── */}
          <View style={styles.support}>
            <Text style={styles.supportTxt}>Issue with this transaction?</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.supportLink}>Contact support</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Bottom CTAs ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => router.replace('/(protected)/(tabs)/wallet' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaPrimaryTxt}>Go to my wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => router.push('/(protected)/market' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.ctaSecondaryTxt}>Explore markets</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { paddingBottom: 8 },

  // Hero
  hero: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
    gap: 20,
  },
  statusBlock: { alignItems: 'center', gap: 10 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusBadgeDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBadgeTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
  },

  // Section
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },

  // What's next
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  nextRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  nextIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nextText: { flex: 1 },
  nextTitle: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 2 },
  nextSub: { fontSize: 11, color: '#AAA', lineHeight: 15 },

  // Support
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  supportTxt: { fontSize: 12, color: '#AAA' },
  supportLink: { fontSize: 12, color: '#111', fontWeight: '600' },

  // CTAs
  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 0.5,
    borderTopColor: '#EBEBEB',
    gap: 8,
  },
  ctaPrimary: {
    backgroundColor: '#111',
    borderRadius: 100,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaPrimaryTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaSecondary: {
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ctaSecondaryTxt: { fontSize: 15, fontWeight: '600', color: '#111' },
});