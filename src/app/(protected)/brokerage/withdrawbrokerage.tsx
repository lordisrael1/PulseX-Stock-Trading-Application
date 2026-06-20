/**
 * WithdrawBrokerageScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Step 1 of 3 — Withdraw buying power from brokerage to wallet.
 * Matches 20.png + 200.png exactly.
 *
 * Features:
 *  - Brokerage selector (US Brokerage / NGX Brokerage)
 *  - Cash breakdown: Available (buying power), Unsettled cash, Reserved cash
 *  - Only "buying power" is withdrawable — unsettled & reserved are blocked
 *  - Amber warning explaining the withdrawal restriction
 *  - Amount entry with quick chips + full numpad
 *  - CTA disabled until valid amount entered
 *
 * API / STATE INTEGRATION:
 *  → Pull cash breakdown from Redux:
 *    const { buyingPower, unsettledCash, reservedCash } =
 *      useSelector(s => s.brokerage[exchange])
 *  → On Continue: store amount + exchange, navigate to review step
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
// ─── Types ────────────────────────────────────────────────────────────────────

type Exchange = 'US' | 'NGX';

// ─── Mock brokerage cash data ─────────────────────────────────────────────────
// In production: pull from Redux store per exchange


function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);

  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);

    const day = result.getDay();

    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return result;
}

const unsettledDate = addBusinessDays(new Date(), 1);

const formattedUnsettledDate =
  unsettledDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const MOCK_CASH = {
  US: {
    buyingPower:   1_240.00,
    unsettled:     364.20,
    unsettledDate: formattedUnsettledDate,
    reserved:      498.60,
    reservedOrders: 2,
    currency: 'USD',
    symbol:   '$',
    label:    'US Brokerage',
    sub:      'NYSE · NASDAQ · USD',
    prefix:   'US',
    chips:    ['100', '500', '1000'],
    min:      10,
  },
  NGX: {
    buyingPower:   182_340.00,
    unsettled:     24_250.00,
    unsettledDate: formattedUnsettledDate,
    reserved:      0,
    reservedOrders: 0,
    currency: 'NGN',
    symbol:   '₦',
    label:    'NGX Brokerage',
    sub:      'Nigerian Exchange · NGN',
    prefix:   'NG',
    chips:    ['5000', '20000', '100000'],
    min:      500,
  },
};

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ active }: { active: 1 | 2 | 3 }) {
  const steps = ['Amount', 'Review', 'Done'] as const;
  return (
    <View style={styles.stepRow}>
      {steps.map((label, i) => {
        const idx    = (i + 1) as 1 | 2 | 3;
        const isDone = idx < active;
        const isCur  = idx === active;
        return (
          <View
            key={label}
            style={[styles.stepItem, i < steps.length - 1 && styles.stepItemFlex]}
          >
            <View style={styles.stepNodeWrap}>
              <View style={[
                styles.stepDot,
                isDone && styles.stepDotDone,
                isCur  && styles.stepDotActive,
              ]}>
                {isDone ? (
                  <Svg width={10} height={10} viewBox="0 0 24 24">
                    <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5}
                      strokeLinecap="round" fill="none" />
                  </Svg>
                ) : (
                  <Text style={[
                    styles.stepDotTxt,
                    (isDone || isCur) && { color: '#fff' },
                  ]}>
                    {idx}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                (isDone || isCur) && styles.stepLabelOn,
              ]}>
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Numpad ───────────────────────────────────────────────────────────────────

const NUMPAD_ROWS = [
  [{ k: '1', s: ''     }, { k: '2', s: 'ABC'  }, { k: '3', s: 'DEF'  }],
  [{ k: '4', s: 'GHI'  }, { k: '5', s: 'JKL'  }, { k: '6', s: 'MNO'  }],
  [{ k: '7', s: 'PQRS' }, { k: '8', s: 'TUV'  }, { k: '9', s: 'WXYZ' }],
  [{ k: '.', s: ''     }, { k: '0', s: ''      }, { k: '⌫', s: ''     }],
];

function Numpad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <View style={styles.numpad}>
      {NUMPAD_ROWS.map((row, ri) => (
        <View key={ri} style={styles.numRow}>
          {row.map(({ k, s }) => (
            <TouchableOpacity
              key={k}
              style={styles.numKey}
              onPress={() => onKey(k)}
              activeOpacity={0.5}
            >
              {k === '⌫' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-5 5M13 9l5 5"
                    stroke="#666" strokeWidth={1.8} strokeLinecap="round" fill="none"
                  />
                </Svg>
              ) : (
                <View style={styles.numKeyInner}>
                  <Text style={styles.numKeyNum}>{k}</Text>
                  {s.length > 0 && (
                    <Text style={styles.numKeySub}>{s}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WithdrawBrokerageScreen() {
  const router = useRouter();

  const [exchange, setExchange] = useState<Exchange>('US');
  const [raw,      setRaw]      = useState('');

  const cfg     = MOCK_CASH[exchange];
  const numeric = parseFloat(raw || '0');
  const overMax  = numeric > cfg.buyingPower;
  const belowMin = numeric > 0 && numeric < cfg.min;
  const canContinue = numeric >= cfg.min && !overMax;

  const displayVal = raw || '0';

  const handleKey = useCallback((k: string) => {
    if (k === '⌫') {
      setRaw(p => p.slice(0, -1));
      return;
    }
    if (k === '.') {
      if (raw.includes('.')) return;
      if (raw === '') {
        setRaw('0.');
        return;
      }
      setRaw(p => p + '.');
      return;
    }
    if (raw.includes('.')) {
      const decimals = raw.split('.')[1];
      if (decimals && decimals.length >= 2) return;
    }
    if (raw.length >= 10) return;
    if (raw === '0') {
      setRaw(k);
      return;
    }
    setRaw(p => p + k);
  }, [raw]);

  const handleChip = (v: string) => setRaw(v);

  const handleExchangeSwitch = (exc: Exchange) => {
    setExchange(exc);
    setRaw('');
  };

  const handleContinue = () => {
    if (!canContinue) return;
    // ── TODO: store amount + exchange in payment store ─────────────
    // usePaymentStore.getState().setAmount(numeric);
    // usePaymentStore.getState().setExchange(exchange);
    // usePaymentStore.getState().setDirection('brokerage_to_wallet');
    // ──────────────────────────────────────────────────────────────
    //router.push('/(protected)/brokerage/withdrawbrokeragereview' as any);
    router.push({
    pathname: '/(protected)/brokerage/withdrawbrokeragereview',
    params: {
      amount: String(numeric),
      exchange,
    },
  } as any);
  };

  const fmtAmt = (n: number) =>
    n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hintText = overMax
    ? `Exceeds buying power (${cfg.symbol}${fmtAmt(cfg.buyingPower)})`
    : belowMin
    ? `Minimum is ${cfg.symbol}${cfg.min.toLocaleString('en-NG')}`
    : `Min ${cfg.symbol}${cfg.min.toLocaleString('en-NG')} · Max ${cfg.symbol}${fmtAmt(cfg.buyingPower)} (buying power)`;

  const amtColor = overMax || belowMin ? '#DC2626' : '#0A0A0A';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Withdraw to wallet</Text>
          <Text style={styles.topSub}>Brokerage → Wallet</Text>
        </View>
        <Text style={styles.topStep}>Step 1 of 3</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step bar ── */}
          <StepBar active={1} />

          {/* ── Brokerage selector ── */}
          <Text style={styles.sectionLbl}>From which brokerage?</Text>
          <View style={styles.excRow}>
            <TouchableOpacity
              style={[styles.excCard, exchange === 'US' && styles.excCardActive]}
              onPress={() => handleExchangeSwitch('US')}
              activeOpacity={0.75}
            >
              <Text style={[styles.excPrefix, exchange === 'US' && styles.excPrefixActive]}>
                US
              </Text>
              <Text style={[styles.excLabel, exchange === 'US' && styles.excLabelActive]}>
                US Brokerage
              </Text>
              <Text style={[styles.excSub, exchange === 'US' && styles.excSubActive]}>
                NYSE · NASDAQ · USD
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.excCard, exchange === 'NGX' && styles.excCardActive]}
              onPress={() => handleExchangeSwitch('NGX')}
              activeOpacity={0.75}
            >
              <Text style={[styles.excPrefix, exchange === 'NGX' && styles.excPrefixActive]}>
                NG
              </Text>
              <Text style={[styles.excLabel, exchange === 'NGX' && styles.excLabelActive]}>
                NGX Brokerage
              </Text>
              <Text style={[styles.excSub, exchange === 'NGX' && styles.excSubActive]}>
                Nigerian Exchange · NGN
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Cash breakdown ── */}
          <View style={styles.cashCard}>
            {/* Available / buying power */}
            <View style={styles.cashRow}>
              <View style={[styles.cashIco, { backgroundColor: '#E8F5E9' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Rect x={2} y={7} width={20} height={14} rx={3}
                    stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                  <Path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"
                    stroke="#2E7D32" strokeWidth={1.6} fill="none" />
                </Svg>
              </View>
              <View style={styles.cashInfo}>
                <Text style={styles.cashLbl}>Available (buying power)</Text>
                <Text style={styles.cashVal}>
                  {cfg.symbol}{fmtAmt(cfg.buyingPower)}
                </Text>
              </View>
              <View style={styles.withdrawablePill}>
                <Text style={styles.withdrawablePillTxt}>Withdrawable</Text>
              </View>
            </View>

            <View style={styles.cashDivider} />

            {/* Unsettled cash */}
            <View style={styles.cashRow}>
              <View style={[styles.cashIco, { backgroundColor: '#FFFBEB' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
                    stroke="#92400E" strokeWidth={1.8} fill="none" />
                  <Path d="M12 6v6l4 2" stroke="#92400E" strokeWidth={1.8}
                    strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.cashInfo}>
                <Text style={styles.cashLbl}>Unsettled cash</Text>
                <Text style={[styles.cashVal, { color: '#92400E' }]}>
                  {cfg.symbol}{fmtAmt(cfg.unsettled)}
                </Text>
              </View>
              <View style={styles.unsettledPill}>
                <Text style={styles.unsettledPillTxt}>T+1 · {cfg.unsettledDate}</Text>
              </View>
            </View>

            <View style={styles.cashDivider} />

            {/* Reserved cash */}
            <View style={styles.cashRow}>
              <View style={[styles.cashIco, { backgroundColor: '#EFF6FF' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Rect x={3} y={11} width={18} height={11} rx={2}
                    stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
                  <Path d="M7 11V7a5 5 0 0 1 10 0v4"
                    stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
                </Svg>
              </View>
              <View style={styles.cashInfo}>
                <Text style={styles.cashLbl}>Reserved cash</Text>
                <Text style={[styles.cashVal, { color: '#1D4ED8' }]}>
                  {cfg.symbol}{fmtAmt(cfg.reserved)}
                </Text>
              </View>
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillTxt}>Pending orders</Text>
              </View>
            </View>
          </View>

          {/* ── Withdrawal restriction warning ── */}
          <View style={styles.warnBox}>
            <Svg width={16} height={16} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
              <Path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                stroke="#92400E" strokeWidth={1.8} fill="none"
              />
              <Path d="M12 9v4M12 17h.01" stroke="#92400E" strokeWidth={1.8}
                strokeLinecap="round" fill="none" />
            </Svg>
            <Text style={styles.warnTxt}>
              You can only withdraw <Text style={styles.warnBold}>buying power</Text>.
              {' '}Unsettled cash ({cfg.symbol}{fmtAmt(cfg.unsettled)}) clears on {cfg.unsettledDate}
              {' '}and reserved cash ({cfg.symbol}{fmtAmt(cfg.reserved)}) is held for pending orders.
            </Text>
          </View>

          {/* ── Amount display ── */}
          <View style={styles.amtArea}>
            <Text style={styles.amtLabel}>HOW MUCH TO WITHDRAW?</Text>
            <View style={styles.amtRow}>
              <Text style={[styles.amtSymbol, { color: raw ? amtColor : '#CCCCCC' }]}>
                {cfg.symbol}
              </Text>
              <Text style={[styles.amtVal, { color: raw ? amtColor : '#CCCCCC' }]}>
                {displayVal}
              </Text>
            </View>
            <Text style={[
              styles.amtHint,
              (overMax || belowMin) && styles.amtHintError,
            ]}>
              {hintText}
            </Text>
          </View>

          {/* ── Quick chips ── */}
          <View style={styles.chipsRow}>
            {cfg.chips.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, raw === v && styles.chipActive]}
                onPress={() => handleChip(v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipTxt, raw === v && styles.chipTxtActive]}>
                  {cfg.symbol}{parseFloat(v).toLocaleString('en-NG')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, raw === String(cfg.buyingPower) && styles.chipActive]}
              onPress={() => handleChip(String(cfg.buyingPower))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipTxt, raw === String(cfg.buyingPower) && styles.chipTxtActive]}>
                Max
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Numpad ── */}
          <Numpad onKey={handleKey} />

          {/* ── Continue CTA ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
              disabled={!canContinue}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaTxt, !canContinue && styles.ctaTxtDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18,
    paddingVertical: 12, borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE', gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  topCenter:  { flex: 1 },
  topTitle:   { fontSize: 15, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:     { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  topStep:    { fontSize: 11, color: '#AAAAAA' },

  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  stepItem:     { flexDirection: 'row', alignItems: 'flex-start' },
  stepItemFlex: { flex: 1 },
  stepNodeWrap: { alignItems: 'center', gap: 4 },
  stepLine: {
    flex: 1, height: 1.5,
    backgroundColor: '#E8E8E8',
    marginTop: 11, marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: '#7C1F1F' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#7C1F1F', borderColor: '#7C1F1F' },
  stepDotActive: {
    backgroundColor: '#7C1F1F', borderColor: '#7C1F1F',
    shadowColor: '#7C1F1F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  stepDotTxt:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLabel:   { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.2 },
  stepLabelOn: { color: '#7C1F1F' },

  sectionLbl: {
    fontSize: 12, fontWeight: '600', color: '#555',
    marginBottom: 10,
  },

  excRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  excCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    borderColor: '#E8E8E8', backgroundColor: '#fff',
    padding: 12, gap: 2,
  },
  excCardActive: {
    borderColor: '#7C1F1F', borderWidth: 1.5,
    backgroundColor: '#FFF5F5',
  },
  excPrefix: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 0.5,
  },
  excPrefixActive: { color: '#7C1F1F' },
  excLabel: {
    fontSize: 13, fontWeight: '700', color: '#0A0A0A',
  },
  excLabelActive: { color: '#7C1F1F' },
  excSub:    { fontSize: 10, color: '#AAAAAA' },
  excSubActive: { color: '#991B1B' },

  cashCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    overflow: 'hidden', marginBottom: 14,
  },
  cashRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  cashDivider: { height: 0.5, backgroundColor: '#F0F0F0' },
  cashIco: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cashInfo: { flex: 1 },
  cashLbl:  { fontSize: 12, color: '#888' },
  cashVal:  { fontSize: 15, fontWeight: '700', color: '#0A0A0A', marginTop: 1 },
  withdrawablePill: {
    backgroundColor: '#E8F5E9', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  withdrawablePillTxt: { fontSize: 11, fontWeight: '700', color: '#166634' },
  unsettledPill: {
    backgroundColor: '#FFFBEB', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  unsettledPillTxt: { fontSize: 10, fontWeight: '600', color: '#92400E' },
  pendingPill: {
    backgroundColor: '#EFF6FF', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  pendingPillTxt: { fontSize: 10, fontWeight: '600', color: '#1D4ED8' },

  warnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    backgroundColor: '#FFFBEB', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#FDE68A',
    padding: 13, marginBottom: 22,
  },
  warnTxt:  { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  warnBold: { fontWeight: '800' },

  amtArea:   { alignItems: 'center', marginBottom: 16 },
  amtLabel: {
    fontSize: 11, fontWeight: '700', color: '#CCCCCC',
    letterSpacing: 1.5, marginBottom: 12,
  },
  amtRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 3,
  },
  amtSymbol: {
    fontSize: 22, fontWeight: '500',
    marginTop: 8,
  },
  amtVal: {
    fontSize: 52, fontWeight: '500',
    letterSpacing: -2, lineHeight: 58,
  },
  amtHint:      { fontSize: 12, color: '#AAAAAA', marginTop: 8 },
  amtHintError: { color: '#DC2626', fontWeight: '600' },

  chipsRow: {
    flexDirection: 'row', gap: 8,
    justifyContent: 'center', marginBottom: 12,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#E4E4E4', backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#7C1F1F', borderColor: '#7C1F1F',
  },
  chipTxt:       { fontSize: 12, fontWeight: '700', color: '#555' },
  chipTxtActive: { color: '#fff' },

  numpad: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    marginBottom: 0,
  },
  numRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
  },
  numKey: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#F0F0F0',
    minHeight: 58,
  },
  numKeyInner: { alignItems: 'center', gap: 2 },
  numKeyNum:   { fontSize: 22, fontWeight: '400', color: '#0A0A0A', lineHeight: 26 },
  numKeySub:   { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.8 },

  ctaWrap: { paddingTop: 12 },
  cta: {
    backgroundColor: '#0A0A0A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#F0F0F0' },
  ctaTxt:         { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaTxtDisabled: { color: '#BBBBBB' },
});