/**
 * CardConfirmScreen.tsx
 * Step 3 of 3 — Confirm and authenticate a card deposit.
 * Biometric/PIN gates the charge. Full fee breakdown before CTA.
 */

import * as LocalAuthentication from 'expo-local-authentication';
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
import Svg, { Path, Rect } from 'react-native-svg';
import { useCardStore } from '../../../../store/useCardStore';
import { useWalletStore } from '../../../../store/useWalletStore';
import { CardNetworkLogo } from './addCard';

type CardNetwork = 'visa' | 'mastercard' | 'verve';


function CheckSvg() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24">
      <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function StepBar() {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepPair}>
        <View style={styles.stepNode}>
          <View style={[styles.stepDot, styles.stepDotDone]}><CheckSvg /></View>
          <Text style={styles.stepLbl}>Amount</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: '#0A0A0A' }]} />
      </View>
      <View style={styles.stepPair}>
        <View style={styles.stepNode}>
          <View style={[styles.stepDot, styles.stepDotDone]}><CheckSvg /></View>
          <Text style={styles.stepLbl}>Method</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: '#0A0A0A' }]} />
      </View>
      <View style={styles.stepNode}>
        <View style={[styles.stepDot, styles.stepDotActive]}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>3</Text>
        </View>
        <Text style={[styles.stepLbl, { color: '#0A0A0A' }]}>Confirm</Text>
      </View>
    </View>
  );
}

function DRow({ label, value, color, bold, last }: {
  label: string; value: string; color?: string; bold?: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.dRow, last && styles.dRowLast]}>
      <Text style={[styles.dLbl, bold && { fontWeight: '700', color: '#0A0A0A' }]}>{label}</Text>
      <Text style={[styles.dVal, bold && { fontSize: 14 }, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function CardConfirmScreen() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    amount?: string; cardId?: string;
    cardLast4?: string; cardNetwork?: string;
    cardHolder?: string; cardExpiry?: string;
  }>();

  const cards = useCardStore((s) => s.cards);
  const depositNGN = useWalletStore((s) => s.depositNGN);
  const storedCard = cards.find((c) => c.id === p.cardId);

  const amount      = p.amount      ?? '10000';
  const cardLast4   = storedCard?.last4       ?? p.cardLast4   ?? '4521';
  const network     = (storedCard?.network    ?? p.cardNetwork ?? 'visa') as CardNetwork;
  const cardHolder  = storedCard?.holderName  ?? p.cardHolder  ?? 'Joseph Israel';
  const cardExpiry  = storedCard?.expiry      ?? p.cardExpiry  ?? '09/27';

  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const fmt = (n: string) =>
    `₦${parseFloat(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const handleConfirm = async () => {
    setErr('');
    setLoading(true);
    try {
      const hasHw  = await LocalAuthentication.hasHardwareAsync();
      const enroll = await LocalAuthentication.isEnrolledAsync();

      if (hasHw && enroll) {
        const r = await LocalAuthentication.authenticateAsync({
          promptMessage: `Confirm ${fmt(amount)} card charge`,
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
          fallbackLabel: 'Use PIN',
        });
        if (!r.success) {
          setErr('Authentication cancelled. Tap to try again.');
          setLoading(false);
          return;
        }
      }

      // ── TODO: call your card charge API ───────────────────────────────
      // const res = await fetch('/api/deposits/card', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({ amount: parseFloat(amount), cardToken, ref }),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);
      // ─────────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1400));
      depositNGN(parseFloat(amount));
      const ref = `PX${Math.floor(Math.random() * 90_000_000 + 10_000_000)}`;

      router.replace({
        pathname: '/(protected)/payment/deposit/pending',
        params: { amount, bank: `${network.toUpperCase()} •••• ${cardLast4}`, accountNo: '', accountName: cardHolder, ref, method: 'card' },
      } as any);
    } catch (e: any) {
      setErr(e?.message ?? 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7} disabled={loading}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Confirm payment</Text>
          <Text style={styles.topSub}>Step 3 of 3</Text>
        </View>
        <Text style={styles.topAmt}>{fmt(amount)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StepBar />

        <View style={styles.heroWrap}>
          <Text style={styles.heroLbl}>CHARGING TO YOUR CARD</Text>
          <Text style={styles.heroAmt}>{fmt(amount)}</Text>
          <Text style={styles.heroPurpose}>Wallet deposit · PulseX</Text>
        </View>

        <TouchableOpacity style={styles.cardRow} onPress={() => router.back()} activeOpacity={0.75} disabled={loading}>
          <CardNetworkLogo network={network} width={50} height={32} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardNum}>•••• •••• •••• {cardLast4}</Text>
            <Text style={styles.cardMeta}>{cardHolder} · Exp {cardExpiry}</Text>
          </View>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M9 18l6-6-6-6" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.breakCard}>
          <DRow label="Deposit amount"      value={fmt(amount)} />
          <DRow label="Card processing fee" value="Free"        color="#166634" />
          <DRow label="Total charged"       value={fmt(amount)} bold last />
        </View>

        <View style={styles.stmtBox}>
          <Svg width={15} height={15} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <Path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
              stroke="#B45309" strokeWidth={1.8} fill="none" />
            <Path d="M9 12l2 2 4-4" stroke="#B45309" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.stmtTxt}>
            Appears as <Text style={{ fontWeight: '700' }}>PULSEX</Text> on your card statement.
            Funds credit instantly to your wallet.
          </Text>
        </View>

        {err.length > 0 && (
          <View style={styles.errBox}>
            <Text style={styles.errTxt}>{err}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cta, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Svg width={17} height={17} viewBox="0 0 24 24">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  stroke="#fff" strokeWidth={1.5} fill="none" />
                <Path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
                  stroke="#fff" strokeWidth={1.5} fill="none" />
                <Path d="M12 16h.01" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.ctaTxt}>Confirm · Authenticate</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaGhost} onPress={() => router.back()} disabled={loading} activeOpacity={0.75}>
          <Text style={styles.ctaGhostTxt}>Change payment method</Text>
        </TouchableOpacity>

        <View style={styles.secFooter}>
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
          </Svg>
          <Text style={styles.secTxt}>256-bit TLS · PCI DSS compliant</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
  },
  backBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1 },
  topTitle: { fontSize: 14, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  topAmt:   { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  scroll:   { paddingHorizontal: 18, paddingTop: 18 },
  stepRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 22 },
  stepPair: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  stepNode: { alignItems: 'center', gap: 4 },
  stepLine: { flex: 1, height: 1.5, marginTop: 10, marginHorizontal: 4 },
  stepDot:  {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  stepDotActive: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A', shadowColor: '#0A0A0A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  stepLbl:       { fontSize: 9, fontWeight: '600', color: '#AAAAAA' },
  heroWrap:      { alignItems: 'center', paddingVertical: 20, marginBottom: 14 },
  heroLbl:       { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 8 },
  heroAmt:       { fontSize: 42, fontWeight: '500', color: '#0A0A0A', letterSpacing: -1.5, marginBottom: 4 },
  heroPurpose:   { fontSize: 13, color: '#AAAAAA' },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#EBEBEB', padding: 13, marginBottom: 12 },
  netBox:        { width: 44, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo:      { flex: 1 },
  cardNum:       { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  cardMeta:      { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  breakCard:     { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#EBEBEB', paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  dRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  dRowLast:      { borderBottomWidth: 0, paddingTop: 12 },
  dLbl:          { fontSize: 12, color: '#AAAAAA' },
  dVal:          { fontSize: 12, fontWeight: '600', color: '#0A0A0A' },
  stmtBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#FFF8E1', borderRadius: 12, borderWidth: 0.5, borderColor: '#FDE68A', padding: 12, marginBottom: 14 },
  stmtTxt:       { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 17 },
  errBox:        { backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 0.5, borderColor: '#FECACA', padding: 12, marginBottom: 14 },
  errTxt:        { fontSize: 13, color: '#DC2626', textAlign: 'center' },
  cta:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#0A0A0A', borderRadius: 14, paddingVertical: 16, marginBottom: 9 },
  ctaTxt:        { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaGhost:      { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#E0E0E0', marginBottom: 16 },
  ctaGhostTxt:   { fontSize: 14, fontWeight: '600', color: '#888' },
  secFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secTxt:        { fontSize: 11, color: '#CCCCCC' },
});