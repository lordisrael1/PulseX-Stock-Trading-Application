/**
 * DepositPendingScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Shown immediately after user taps "I've made the transfer".
 * This is NOT a success screen — it's a realistic pending/processing
 * state while we wait for the NIBSS webhook from your payment provider
 * (Nomba, Monnify, Paystack, etc.).
 *
 * Flow:
 *  1. User taps "I've made the transfer" on virtual account screen
 *  2. This screen shows immediately — amber/processing state
 *  3. Your backend receives the webhook from payment provider
 *  4. You push a push notification → user taps → lands on wallet
 *     OR you poll the status endpoint every few seconds while this
 *     screen is mounted, and auto-navigate on success
 *
 * STATUS POLLING:
 *  → Replace TODO in useEffect with your deposit status endpoint:
 *    GET /api/deposits/:ref/status
 *    Response: { status: 'pending' | 'success' | 'failed', balance?: number }
 *  → On 'success': navigate to wallet with a toast
 *  → On 'failed': show error and contact support
 *
 * PUSH NOTIFICATIONS:
 *  → Your backend sends a push to the device via Expo Notifications
 *    when the webhook fires. Handle in app/_layout.tsx and
 *    navigate accordingly.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Linking,
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

// ─── Polling config ───────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;  // check every 5 seconds
const MAX_POLLS        = 60;     // give up after 5 minutes (60 × 5s)

type DepositStatus = 'pending' | 'success' | 'failed';

// ─── Pulse dot component ──────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.pulseDot, { backgroundColor: color, opacity }]}
    />
  );
}

// ─── Animated clock icon ──────────────────────────────────────────────────────

function PendingIcon({ status }: { status: DepositStatus }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'pending') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status]);

  if (status === 'success') {
    return (
      <View style={[styles.heroIcon, styles.heroIconSuccess]}>
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
          <Path d="M8 12l3 3 5-5" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={[styles.heroIcon, styles.heroIconFailed]}>
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} stroke="#DC2626" strokeWidth={1.8} fill="none" />
          <Path d="M15 9l-6 6M9 9l6 6" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.heroIcon, styles.heroIconPending, { opacity }]}>
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Path
          d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
          stroke="#B45309" strokeWidth={1.8} fill="none"
        />
        <Path
          d="M12 6v6l4 2"
          stroke="#B45309" strokeWidth={1.8} strokeLinecap="round" fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ status }: { status: DepositStatus }) {
  const confirmColor = status === 'success' ? '#0A0A0A' : status === 'failed' ? '#DC2626' : '#EF9F27';
  return (
    <View style={styles.stepRow}>
      {/* Amount — done */}
      <View style={styles.stepPair}>
        <View style={styles.stepNode}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.stepLblDone}>Amount</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: '#0A0A0A' }]} />
      </View>

      {/* Method — done */}
      <View style={styles.stepPair}>
        <View style={styles.stepNode}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.stepLblDone}>Method</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: confirmColor }]} />
      </View>

      {/* Confirm — pending/success/failed */}
      <View style={styles.stepNode}>
        <View style={[styles.stepDot, { backgroundColor: confirmColor, borderColor: confirmColor }]}>
          {status === 'success' ? (
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            </Svg>
          ) : status === 'failed' ? (
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            </Svg>
          ) : (
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M12 6v6l3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          )}
        </View>
        <Text style={[styles.stepLblDone, { color: confirmColor }]}>Confirm</Text>
      </View>
    </View>
  );
}

// ─── Receipt row ──────────────────────────────────────────────────────────────

function ReceiptRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <View style={[styles.rrow, last && styles.rrowLast]}>
      <Text style={styles.rlabel}>{label}</Text>
      <Text style={[styles.rvalue, mono && styles.rvalueMono]}>{value}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DepositPendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?:      string;
    bank?:        string;
    accountNo?:   string;
    accountName?: string;
    ref?:         string;
  }>();

  const amount      = params.amount      ?? '10000';
  const bank        = params.bank        ?? 'Providus Bank';
  const accountNo   = params.accountNo   ?? '2847163920';
  const accountName = params.accountName ?? 'PULSEX / JOSEPH ISRAEL';
  const ref         = params.ref         ?? 'PX43180843';

  const [status,    setStatus]    = useState<DepositStatus>('pending');
  const [pollCount, setPollCount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fmtNGN = (n: string) =>
    `₦${parseFloat(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  // ── Poll deposit status ──────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    if (pollCount >= MAX_POLLS) return; // give up after 5 minutes

    try {
      // ── TODO: replace with your real endpoint ──────────────────────
      // const res = await fetch(`https://your-api.pulsex.io/api/deposits/${ref}/status`, {
      //   headers: { Authorization: `Bearer ${accessToken}` },
      // });
      // const data = await res.json();
      // const depositStatus: DepositStatus = data.status;
      // ─────────────────────────────────────────────────────────────
      // MOCK: auto-succeed after 3 polls (15s) for demo purposes
      const mockStatus = (pollCount >= 3 ? 'success' : 'pending') as DepositStatus;

      if (mockStatus === 'success') {
        setStatus('success');
        setTimeout(() => {
          router.replace('/(protected)/(tabs)/wallet' as any);
        }, 2000);
      } else if (mockStatus === 'failed') {
        setStatus('failed');
      } else {
        setPollCount(c => c + 1);
        pollRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS);
      }
    } catch (e) {
      console.error('[DepositPending] poll error:', e);
      // Network error — retry silently
      pollRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS);
    }
  }, [pollCount, ref]);

  useEffect(() => {
    // Start polling immediately
    pollRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [pollStatus]);

  const handleCheckWallet = () => {
    router.push('/(protected)/(tabs)/wallet' as any);
  };

  const handleContactSupport = () => {
    // Open your support channel
    Linking.openURL('mailto:support@pulsex.io?subject=Deposit%20not%20reflected&body=Ref:%20' + ref);
  };

  const heroText = status === 'success'
    ? 'Deposit confirmed'
    : status === 'failed'
    ? 'Transfer failed'
    : 'Transfer submitted';

  const heroSub = status === 'success'
    ? 'Credited to your wallet'
    : status === 'failed'
    ? 'Could not process your transfer'
    : 'Awaiting bank confirmation';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>{heroText}</Text>
          <Text style={styles.topSub}>{heroSub}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <StepIndicator status={status} />

        {/* ── Hero ── */}
        <View style={styles.heroWrap}>
          <PendingIcon status={status} />
          <Text style={styles.heroAmtLbl}>TRANSFER RECEIVED FROM YOU</Text>
          <Text style={styles.heroAmt}>{fmtNGN(amount)}</Text>

          {status === 'pending' && (
            <View style={styles.statusBadge}>
              <PulseDot color="#EF9F27" />
              <Text style={styles.statusBadgeTxt}>Waiting for bank confirmation</Text>
            </View>
          )}
          {status === 'success' && (
            <View style={[styles.statusBadge, styles.statusBadgeGreen]}>
              <View style={[styles.pulseDot, { backgroundColor: '#2E7D32' }]} />
              <Text style={[styles.statusBadgeTxt, { color: '#1A5C2A' }]}>Credited to your wallet</Text>
            </View>
          )}
          {status === 'failed' && (
            <View style={[styles.statusBadge, styles.statusBadgeRed]}>
              <View style={[styles.pulseDot, { backgroundColor: '#DC2626' }]} />
              <Text style={[styles.statusBadgeTxt, { color: '#991B1B' }]}>Transfer could not be processed</Text>
            </View>
          )}
        </View>

        {/* ── Assurance notice — only when pending ── */}
        {status === 'pending' && (
          <View style={styles.noticeBox}>
            <View style={styles.noticeHeader}>
              <Svg width={17} height={17} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                  stroke="#B45309" strokeWidth={1.8} fill="none" />
                <Path d="M12 8v4M12 16h.01"
                  stroke="#B45309" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitleTxt}>Your transfer is on its way</Text>
                <Text style={styles.noticeBodyTxt}>
                  We've received your transfer instruction. NIBSS settlements can take a few seconds
                  to a few minutes depending on your bank's processing speed.
                  You don't need to do anything — we're watching for it.
                </Text>
              </View>
            </View>

            <View style={styles.noticeDivider} />

            {[
              { color: '#2E7D32', text: 'Most deposits reflect within 30 seconds' },
              { color: '#EF9F27', text: 'Busy periods may take up to 5 minutes' },
              { color: '#DC2626', text: 'Not reflected in 30 min? Contact support' },
            ].map(r => (
              <View key={r.text} style={styles.noticeRow}>
                <View style={[styles.noticeDot, { backgroundColor: r.color }]} />
                <Text style={styles.noticeRowTxt}>{r.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Failed notice ── */}
        {status === 'failed' && (
          <View style={styles.failedBox}>
            <Text style={styles.failedTitle}>What happened?</Text>
            <Text style={styles.failedBody}>
              We didn't receive confirmation of your transfer within the expected window.
              This can happen if the virtual account expired, or if your bank's transfer
              didn't complete. If money left your account, contact support immediately
              with your reference number.
            </Text>
          </View>
        )}

        {/* ── Transfer summary card ── */}
        <View style={styles.receiptCard}>
          <ReceiptRow label="Amount" value={fmtNGN(amount)} />
          <ReceiptRow label="Bank"   value={bank}           />
          <ReceiptRow label="Account" value={accountNo}    />
          <ReceiptRow label="Name"   value={accountName}   />
          <ReceiptRow label="Reference" value={ref} mono last />
        </View>

        {/* ── Push notification assurance ── */}
        {status === 'pending' && (
          <View style={styles.notifBox}>
            <Svg width={16} height={16} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#1D4ED8" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </Svg>
            <Text style={styles.notifTxt}>
              We'll send you a notification the moment your wallet is credited. You can safely go home.
            </Text>
          </View>
        )}

        {/* ── CTAs ── */}
        <TouchableOpacity style={styles.cta} onPress={handleCheckWallet} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Check my wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaGhost} onPress={handleContactSupport} activeOpacity={0.75}>
          <Text style={styles.ctaGhostTxt}>Contact support</Text>
        </TouchableOpacity>

        {/* Security footer */}
        <View style={styles.secFooter}>
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
              stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
          </Svg>
          <Text style={styles.secFooterTxt}>256-bit TLS · NDPR compliant · CBN licensed</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  topBar: {
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', alignItems: 'center',
  },
  topCenter: { alignItems: 'center' },
  topTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 22 },
  stepPair:   { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  stepNode:   { alignItems: 'center', gap: 4 },
  stepLine:   { flex: 1, height: 1.5, marginTop: 10, marginHorizontal: 4 },
  stepDot:    {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: '#E0E0E0', backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:  { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  stepLblDone:  { fontSize: 9, fontWeight: '700', color: '#0A0A0A' },

  heroWrap:   { alignItems: 'center', paddingVertical: 18, marginBottom: 14 },
  heroIcon:   {
    width: 68, height: 68, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroIconPending: { backgroundColor: '#FEF9EC' },
  heroIconSuccess: { backgroundColor: '#E8F5E9' },
  heroIconFailed:  { backgroundColor: '#FEF2F2' },
  heroAmtLbl: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 1.5, marginBottom: 8,
  },
  heroAmt: {
    fontSize: 36, fontWeight: '500', color: '#0A0A0A',
    letterSpacing: -1.2, marginBottom: 12,
  },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FEF9EC', borderWidth: 0.5, borderColor: '#FDE68A',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  statusBadgeGreen: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  statusBadgeRed:   { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusBadgeTxt: { fontSize: 12, fontWeight: '600', color: '#854F0B' },

  pulseDot: { width: 6, height: 6, borderRadius: 3 },

  // Assurance notice
  noticeBox: {
    backgroundColor: '#FFF8E1', borderRadius: 14, borderWidth: 0.5,
    borderColor: '#FDE68A', padding: 14, marginBottom: 14,
  },
  noticeHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
  noticeTitleTxt:{ fontSize: 13, fontWeight: '700', color: '#78350F', marginBottom: 5 },
  noticeBodyTxt: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  noticeDivider: { height: 0.5, backgroundColor: '#FDE68A', marginBottom: 10 },
  noticeRow:     { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 7 },
  noticeDot:     { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  noticeRowTxt:  { fontSize: 12, color: '#78350F', flex: 1 },

  // Failed notice
  failedBox: {
    backgroundColor: '#FFF5F5', borderRadius: 14, borderWidth: 0.5,
    borderColor: '#FECACA', padding: 14, marginBottom: 14,
  },
  failedTitle: { fontSize: 13, fontWeight: '700', color: '#991B1B', marginBottom: 6 },
  failedBody:  { fontSize: 12, color: '#7F1D1D', lineHeight: 18 },

  // Receipt
  receiptCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    paddingVertical: 4, paddingHorizontal: 14, marginBottom: 12,
  },
  rrow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5',
  },
  rrowLast:   { borderBottomWidth: 0 },
  rlabel:     { fontSize: 12, color: '#AAAAAA' },
  rvalue:     { fontSize: 12, fontWeight: '600', color: '#0A0A0A', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  rvalueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },

  // Notification assurance
  notifBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: '#EFF6FF', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#BFDBFE', padding: 12, marginBottom: 16,
  },
  notifTxt: { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 },

  cta: {
    backgroundColor: '#0A0A0A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 9,
  },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#E0E0E0', marginBottom: 16,
  },
  ctaGhostTxt: { fontSize: 14, fontWeight: '600', color: '#888' },

  secFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secFooterTxt: { fontSize: 11, color: '#CCCCCC' },
});