/**
 * DepositConfirmScreen.tsx
 * Step 3 of 3 — Deposit confirm + PIN modal
 *
 * Screens covered:
 *  00.png  — Review & authorise: receipt card, FROM→TO route,
 *            transaction details, "Wallet credited" total,
 *            TRANSACTION PIN 4 empty dots
 *  0.png   — Bottom of same screen: "Use Face ID / biometrics"
 *            row + "Confirm deposit" CTA + security footer
 *  0000.png — Full-screen numpad modal that slides up when user
 *             taps any PIN dot. Keys: 1-9, fingerprint, 0, backspace.
 *             4 dots at top fill in as user taps. On 4th digit,
 *             modal auto-dismisses and triggers the processing flow.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AMOUNT = 20_000;
const WITHDRAWAL_FEE = 52.5;

function parseAmountParam(amount?: string | string[]) {
  const value = Array.isArray(amount) ? amount[0] : amount;
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_AMOUNT;
}

function fmtNGN(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function fmtWholeNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

// ─── Step Bar (all 3 steps done / active) ─────────────────────────────────────

function StepBar() {
  const steps = ['Amount', 'Method', 'Confirm'];
  return (
    <View style={styles.stepRow}>
      {steps.map((s, i) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
          <View style={styles.stepItem}>
            <View style={[styles.dot, styles.dotDone]}>
              <Text style={styles.dotTxtWhite}>✓</Text>
            </View>
            <Text style={[styles.stepLbl, styles.stepLblOn]}>{s}</Text>
          </View>
          {i < 2 && <View style={[styles.stepLine, styles.stepLineDone]} />}
        </View>
      ))}
    </View>
  );
}

// ─── Receipt Row ──────────────────────────────────────────────────────────────

function ReceiptRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.rRow}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text style={[styles.rValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

// ─── PIN Dots ─────────────────────────────────────────────────────────────────

function PinDots({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.pinDotsRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.pinDot,
            i < count && styles.pinDotFilled,
          ]}
        />
      ))}
    </TouchableOpacity>
  );
}

// ─── PIN Numpad Modal (0000.png) ──────────────────────────────────────────────

const NUMPAD_KEYS = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: 'bio', sub: '' },
  { key: '0', sub: '' },
  { key: 'del', sub: '' },
];

function PinModal({
  visible,
  pin,
  onKey,
  onBio,
  onClose,
}: {
  visible: boolean;
  pin: string;
  onKey: (k: string) => void;
  onBio: () => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop */}
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.pinSheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* 4 PIN dots */}
        <View style={styles.modalPinDots}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.modalPinDot,
                i < pin.length && styles.modalPinDotFilled,
              ]}
            >
              {i < pin.length && <View style={styles.modalPinDotInner} />}
            </View>
          ))}
        </View>

        {/* Numpad grid */}
        <View style={styles.numpadGrid}>
          {NUMPAD_KEYS.map(({ key, sub }) => {
            if (key === 'bio') {
              return (
                <TouchableOpacity
                  key="bio"
                  style={styles.numKey}
                  onPress={onBio}
                  activeOpacity={0.5}
                >
                  <Text style={styles.numKeyBio}>⊙</Text>
                </TouchableOpacity>
              );
            }
            if (key === 'del') {
              return (
                <TouchableOpacity
                  key="del"
                  style={styles.numKey}
                  onPress={() => onKey('⌫')}
                  activeOpacity={0.5}
                >
                  <Text style={styles.numKeyDel}>⌫</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={key}
                style={styles.numKey}
                onPress={() => onKey(key)}
                activeOpacity={0.5}
              >
                <Text style={styles.numKeyNum}>{key}</Text>
                {sub ? <Text style={styles.numKeySub}>{sub}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Processing Screen ────────────────────────────────────────────────────────

function ProcessingScreen({ onDone }: { onDone: () => void }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.processingWrap}>
      <View style={styles.procRing}>
        <Animated.View
          style={[styles.procSpinner, { transform: [{ rotate }] }]}
        />
      </View>
      <Text style={styles.procTitle}>Authorising withdrawal</Text>
      <Text style={styles.procSub}>
        Connecting to GTBank securely.{'\n'}Do not close this screen.
      </Text>
    </View>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────


function SuccessScreen({
  onDone,
  amount,
  fee,
}: {
  onDone: () => void;
  amount: number;
  fee: number;
}) {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ref     = useRef(`PX${Math.floor(Math.random() * 90000000 + 10000000)}`);
 
  // ── these should come from your payment store in production ──
  const total      = amount + fee;
  const bankName   = 'United Bank for Africa';
  const acctNumber = '0123456789';
 
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
 
  return (
    <View style={styles.wrap}>
 
      {/* ── Checkmark icon ── */}
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}>
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>
 
      {/* ── Title + subtitle ── */}
      <Text style={styles.title}>Withdrawal sent</Text>
      <Text style={styles.sub}>
        {fmtNGN(amount)} is on its way to {bankName}.{'\n'}Arrives in ~10 minutes.
      </Text>
 
      {/* ── Receipt mini-card ── */}
      <View style={styles.card}>
 
        {/* Amount + status badge */}
        <View style={styles.cardTop}>
          <Text style={styles.cardAmt}>{fmtNGN(total)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>Processing</Text>
          </View>
        </View>
 
        {/* Divider */}
        <View style={styles.divider} />
 
        {/* Detail rows */}
        {[
          { label: 'To',      value: bankName   },
          { label: 'Account', value: acctNumber },
          { label: 'Network', value: 'NIBSS NIP' },
          { label: 'Fee',     value: fmtNGN(fee) },
        ].map(r => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
 
        {/* REF */}
        <Text style={styles.ref}>REF: {ref.current}</Text>
      </View>
 
      {/* ── Receipt + Share row ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.75}
          onPress={() => { /* TODO: generate PDF receipt */ }}
        >
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionTxt}>Receipt</Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.75}
          onPress={() => { /* TODO: share ref */ }}
        >
          <Text style={styles.actionIcon}>⇗</Text>
          <Text style={styles.actionTxt}>Share</Text>
        </TouchableOpacity>
      </View>
 
      {/* ── Back to home ── */}
      <TouchableOpacity style={styles.ctaSS} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.ctaSSTxt}>Back to home</Text>
      </TouchableOpacity>
 
    </View>
  );
}

// function SuccessScreen({ onDone }: { onDone: () => void }) {
//   const scale = useRef(new Animated.Value(0.6)).current;
//   const opacity = useRef(new Animated.Value(0)).current;
//   const ref = useRef(`PX${Math.floor(Math.random() * 90000000 + 10000000)}`);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
//       Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   return (
//     <View style={styles.successWrap}>
//       <Animated.View
//         style={[
//           styles.successIcon,
//           { transform: [{ scale }], opacity },
//         ]}
//       >
//         <Text style={{ fontSize: 32 }}>✓</Text>
//       </Animated.View>
//       <Text style={styles.successTitle}>Withdrawal confirmed</Text>
//       <Text style={styles.successSub}>
//         ₦50,000 has been debited from your PulseX wallet instantly.
//       </Text>

//       <View style={styles.txCard}>
//         <View style={styles.txRow}><Text style={styles.txL}>From</Text><Text style={styles.txV}>Guaranty Trust Bank</Text></View>
//         <View style={styles.txRow}><Text style={styles.txL}>Status</Text><Text style={[styles.txV, { color: '#22C55E' }]}>Completed</Text></View>
//         <View style={styles.txRow}><Text style={styles.txL}>Network</Text><Text style={styles.txV}>Direct debit</Text></View>
//       </View>

//       <Text style={styles.txRef}>
//         REF: {ref.current}
//       </Text>

//       <TouchableOpacity style={styles.cta} onPress={onDone} activeOpacity={0.85}>
//         <Text style={styles.ctaTxt}>Back to home</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// ─── Main Screen ──────────────────────────────────────────────────────────────

type FlowState = 'confirm' | 'processing' | 'success';

export default function WithdrawConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const [pin, setPin] = useState('');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [flow, setFlow] = useState<FlowState>('confirm');
  const amount = parseAmountParam(params.amount);
  const fee = WITHDRAWAL_FEE;
  const total = amount + fee;
  const amountFmt = fmtWholeNGN(amount);

  const now = new Date();
  const timeStr = `${now.getDate().toString().padStart(2, '0')} ${
    now.toLocaleString('en-GB', { month: 'short' })
  }, ${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const handleKey = useCallback(
    (k: string) => {
      if (k === '⌫') {
        setPin(p => p.slice(0, -1));
        return;
      }
      if (pin.length >= 4) return;
      const next = pin + k;
      setPin(next);
      if (next.length === 4) {
        // Auto-dismiss and proceed
        setTimeout(() => {
          setPinModalVisible(false);
          setPin('');
          setFlow('processing');
        }, 300);
      }
    },
    [pin],
  );

  const handleBio = useCallback(() => {
    setPinModalVisible(false);
    setPin('');
    setFlow('processing');
  }, []);

  const handleSubmit = () => {
    if (pin.length === 4) {
      setPinModalVisible(false);
      setPin('');
      setFlow('processing');
    }
  };

  if (flow === 'processing') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <ProcessingScreen onDone={() => setFlow('success')} />
      </SafeAreaView>
    );
  }

  if (flow === 'success') {
    return (
        <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <SuccessScreen
          amount={amount}
          fee={fee}
          onDone={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.topTitle}>Review &amp; authorise</Text>
          <Text style={styles.topSub}>Step 3 of 3 — Final step</Text>
        </View>
        <View style={styles.amtPill}>
          <Text style={styles.amtPillTxt}>{amountFmt}</Text>
        </View>
      </View>

      {/* ── Step bar ── */}
      <View style={styles.stepWrap}>
        <StepBar />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Amount hero ── */}
        <View style={styles.amtHero}>
          <Text style={styles.amtDir}>WITHDRAWING</Text>
          <View style={styles.amtValRow}>
            <Text style={styles.amtSym}>₦</Text>
            <Text style={styles.amtVal}>{amount.toLocaleString('en-NG')}</Text>
          </View>
          <Text style={styles.amtNote}>Debits instantly from your wallet</Text>
        </View>

        {/* Dashed divider */}
        <View style={styles.dashedRule}>
          <View style={styles.drLine} />
          <View style={styles.drCircle} />
          <View style={styles.drLine} />
        </View>

        {/* ── Receipt card ── */}
        <View style={styles.receiptCard}>
          {/* FROM → TO route */}
          <View style={styles.routeRow}>
            {/* FROM */}
            <View style={styles.routeNode}>
              <Text style={styles.routeDir}>FROM</Text>
              <View style={[styles.bankChip, { backgroundColor: '#113322' }]}>
                <Text style={styles.bankChipTxt}>PX</Text>
              </View>
              <Text style={[styles.routeName, { textAlign: 'left' }]}>
                PulseX Wallet
              </Text>
              <Text style={styles.routeAcct}>joseph@pulsex</Text>
            </View>

            {/* Arrow */}
            <View style={styles.routeArrow}>
              <Text style={styles.routeArrowTxt}>→</Text>
            </View>

            {/* TO */}
            <View style={[styles.routeNode, { alignItems: 'flex-end' }]}>
              <Text style={styles.routeDir}>TO</Text>
              <View style={[styles.bankChip, { backgroundColor: '#E86000' }]}>
                <Text style={styles.bankChipTxt}>GTB</Text>
              </View>
              <Text style={styles.routeName}>Guaranty Trust{'\n'}Bank</Text>
              <Text style={styles.routeAcct}>•••• 4412</Text>
            </View>
          </View>

          {/* Detail rows */}
          <View style={styles.receiptBody}>
            <ReceiptRow label="Transaction type" value="Bank account debit" />
            <ReceiptRow label="Processing fee"   value={fmtNGN(fee)} valueColor="#22C55E" />
            <ReceiptRow label="Arrival"          value="Instant" />
            <ReceiptRow label="Time"             value={timeStr} />
          </View>

          {/* Total */}
          <View style={styles.receiptTotal}>
            <Text style={styles.rTotalLabel}>Wallet debited</Text>
            <Text style={styles.rTotalValue}>{fmtNGN(total)}</Text>
          </View>
        </View>

        {/* ── Transaction PIN ── */}
        <Text style={styles.pinSectionLbl}>TRANSACTION PIN</Text>
        <PinDots
          count={pin.length}
          onPress={() => {
            setPin('');
            setPinModalVisible(true);
          }}
        />

        {/* ── Biometric row ── */}
        <TouchableOpacity
          style={styles.bioRow}
          onPress={handleBio}
          activeOpacity={0.7}
        >
          <Text style={styles.bioIcon}>⊙</Text>
          <Text style={styles.bioTxt}>Use Face ID / biometrics</Text>
        </TouchableOpacity>

        {/* ── CTA ── */}
        {/* <TouchableOpacity
          style={[styles.cta, pin.length < 4 && styles.ctaDisabled]}
          disabled={pin.length < 4}
          activeOpacity={0.85}
          onPress={handleSubmit}
        >
          <Text style={[styles.ctaTxt, pin.length < 4 && styles.ctaTxtDisabled]}>
            Confirm withdrawal
          </Text>
        </TouchableOpacity> */}

        {/* ── Security footer ── */}
        <View style={styles.secFooter}>
          <Text style={styles.secTxt}>🔒  256-bit TLS · PCI DSS L1 · CBN licensed</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── PIN Modal ── */}
      <PinModal
        visible={pinModalVisible}
        pin={pin}
        onKey={handleKey}
        onBio={handleBio}
        onClose={() => setPinModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
    gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 16, color: '#555' },
  titleWrap: { flex: 1 },
  topTitle: { fontSize: 15, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.3 },
  topSub:   { fontSize: 11, color: '#BBBBBB', marginTop: 1 },
  amtPill:  { backgroundColor: '#F2F2F2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  amtPillTxt: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },

  // Step bar
  stepWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: '#113322', borderColor: '#113322' },
  dotTxtWhite: { fontSize: 9, fontWeight: '800', color: '#fff' },
  stepLbl:   { fontSize: 10, fontWeight: '700', color: '#CCCCCC' },
  stepLblOn: { color: '#113322' },
  stepLine:     { flex: 1, height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 5 },
  stepLineDone: { backgroundColor: '#113322' },

  // Scroll
  scroll: { padding: 18 },

  // Amount hero
  amtHero:   { alignItems: 'center', paddingVertical: 22 },
  amtDir:    { fontSize: 10, fontWeight: '700', color: '#CCCCCC', letterSpacing: 1.8, marginBottom: 10 },
  amtValRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  amtSym:    { fontSize: 24, fontWeight: '700', color: '#BBBBBB', marginTop: 8 },
  amtVal:    { fontSize: 48, fontWeight: '900', color: '#0A0A0A', letterSpacing: -2, lineHeight: 56 },
  amtNote:   { fontSize: 12, color: '#AAAAAA', marginTop: 8 },

  // Dashed rule
  dashedRule: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  drLine:     { flex: 1, borderTopWidth: 1.5, borderColor: '#E8E8E8' },
  drCircle:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E4E4E4' },

  // Receipt card
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    marginBottom: 18,
  },

  // Route
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  routeNode: { flex: 1, gap: 4 },
  routeDir:  { fontSize: 9, fontWeight: '700', color: '#BBBBBB', letterSpacing: 1 },
  bankChip: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  bankChipTxt: { fontSize: 10, fontWeight: '900', color: '#fff' },
  routeName: { fontSize: 12, fontWeight: '800', color: '#0A0A0A', lineHeight: 17 },
  routeAcct: { fontSize: 10, color: '#BBBBBB' },
  routeArrow: { paddingTop: 32, paddingHorizontal: 10 },
  routeArrowTxt: { fontSize: 18, color: '#CCCCCC' },

  // Receipt body
  receiptBody: { paddingHorizontal: 16, paddingVertical: 4 },
  rRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 9,
    borderBottomWidth: 0.5, borderBottomColor: '#F8F8F8',
  },
  rLabel: { fontSize: 12, color: '#AAAAAA' },
  rValue: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },

  // Receipt total
  receiptTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderTopWidth: 1.5, borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
  },
  rTotalLabel: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  rTotalValue: { fontSize: 20, fontWeight: '900', color: '#0A0A0A', letterSpacing: -0.5 },

  // PIN section
  pinSectionLbl: {
    fontSize: 10, fontWeight: '700', color: '#BBBBBB',
    letterSpacing: 1.4, marginBottom: 14, textAlign: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row', gap: 14, justifyContent: 'center', marginBottom: 18,
  },
  pinDot: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E4E4E4', backgroundColor: '#fff',
  },
  pinDotFilled: {
    backgroundColor: '#113322', borderColor: '#113322',
  },

  // Biometric row
  bioRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, marginBottom: 14,
  },
  bioIcon: { fontSize: 20, color: '#BBBBBB' },
  bioTxt:  { fontSize: 13, color: '#AAAAAA', fontWeight: '600' },

  // CTA
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  ctaDisabled: { backgroundColor: '#E8E8E8' },
  //ctaTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  ctaTxtDisabled: { color: '#BBBBBB' },

  // Security footer
  secFooter: { alignItems: 'center', paddingTop: 4 },
  secTxt: { fontSize: 11, color: '#CCCCCC' },

  // ── PIN Modal ──
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pinSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  dragHandle: {
    width: 32, height: 3, borderRadius: 2, backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginTop: 10, marginBottom: 18,
  },
  modalPinDots: {
    flexDirection: 'row', gap: 14, justifyContent: 'center', marginBottom: 18,
  },
  modalPinDot: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E4E4E4', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  modalPinDotFilled: {
    backgroundColor: '#113322', borderColor: '#113322',
  },
  modalPinDotInner: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff',
  },

  // Numpad grid
  numpadGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderTopWidth: 0.5, borderTopColor: '#F0F0F0',
  },
  numKey: {
    width: '33.333%', paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
    borderRightWidth: 0.5, borderRightColor: '#F0F0F0',
  },
  numKeyNum:  { fontSize: 22, fontWeight: '400', color: '#0A0A0A', lineHeight: 26 },
  numKeySub:  { fontSize: 9, fontWeight: '700', color: '#CCCCCC', letterSpacing: 1, marginTop: 1 },
  numKeyBio:  { fontSize: 22, color: '#BBBBBB' },
  numKeyDel:  { fontSize: 20, color: '#888' },

  // Processing
  processingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  procRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2.5, borderColor: '#E8E8E8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  procSpinner: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2.5, borderColor: '#E8E8E8', borderTopColor: '#113322',
  },
  procTitle: { fontSize: 17, fontWeight: '800', color: '#0A0A0A', marginBottom: 8 },
  procSub:   { fontSize: 13, color: '#AAAAAA', textAlign: 'center', lineHeight: 20 },

  // Success
  //successWrap: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#E4F2EC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#0A0A0A', letterSpacing: -0.4, marginBottom: 6, textAlign: 'center' },
  successSub:   { fontSize: 13, color: '#AAAAAA', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  txCard:  { backgroundColor: '#F8F8F8', borderRadius: 14, padding: 16, width: '100%', marginBottom: 10 },
  txRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  txL:     { fontSize: 12, color: '#AAAAAA' },
  txV:     { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  txRef:   { fontSize: 11, color: '#BBBBBB', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 20 },




  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F7F7F7',
  },
 
  // Icon
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#EDE8F5',           // purple tint — matches screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  checkmark: {
    fontSize: 28,
    color: '#6D28D9',                     // purple checkmark
    fontWeight: '700',
  },
 
  // Title
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
 
  // Receipt card
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
    marginBottom: 14,
  },
 
  // Amount + badge
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardAmt: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#FEF9EC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
 
  // Divider
  divider: {
    height: 0.5,
    backgroundColor: '#F0F0F0',
    marginBottom: 8,
  },
 
  // Detail rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8F8F8',
  },
  rowLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
  },
 
  // REF
  ref: {
    fontSize: 11,
    color: '#CCCCCC',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    paddingVertical: 12,
  },
 
  // Receipt + Share side-by-side
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  actionIcon: {
    fontSize: 16,
    color: '#555',
  },
  actionTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },
 
  // Back to home
  ctaSS: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ctaSSTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 0.1,
  },
});
