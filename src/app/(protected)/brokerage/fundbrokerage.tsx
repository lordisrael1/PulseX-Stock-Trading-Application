/**
 * FundBrokerageScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Step 1 of 3 — Fund brokerage amount entry.
 * Matches 111.png + 1111.png (continuation) exactly.
 *
 * Features:
 *  - Exchange selector (US Stocks / NGX Stocks)
 *  - "From wallet" source display with available balance
 *  - Large centered amount display
 *  - Quick chip amounts
 *  - Full 12-key numpad with letter sub-labels
 *  - Disabled CTA until min amount met
 *  - Navigates to Step 2 (review) on Continue
 *
 * API / STATE INTEGRATION:
 *  → Pull wallet balances from Redux:
 *    const { usdBalance, ngnBalance } = useSelector(s => s.wallet)
 *  → On Continue: store amount + exchange in usePaymentStore / navigation params
 *  → Replace router.push paths with your actual Step 2 route
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

// ─── Mock wallet balances ─────────────────────────────────────────────────────
// In production: pull from Redux store
// const { usdBalance, ngnBalance } = useSelector((s: RootState) => s.wallet)

const MOCK_BALANCES = {
  usd: 29.14,
  ngn: 44_678.32,
};

// ─── Exchange config ──────────────────────────────────────────────────────────

const EXCHANGE_CONFIG = {
  US: {
    label:    'US Stocks',
    sub:      'NYSE · NASDAQ · USD',
    prefix:   'NG',
    currency: 'USD',
    symbol:   '$',
    max:      MOCK_BALANCES.usd,
    min:      10,
    walletLbl:'USD wallet',
    chips:    ['10', '20'],
  },
  NGX: {
    label:    'NGX Stocks',
    sub:      'Nigerian Exchange · NGN',
    prefix:   'US',
    currency: 'NGN',
    symbol:   '₦',
    max:      MOCK_BALANCES.ngn,
    min:      500,
    walletLbl:'NGN wallet',
    chips:    ['500', '5000', '10000'],
  },
};

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ active }: { active: 1 | 2 | 3 }) {
  const steps = ['Amount', 'Review', 'Done'] as const;
  return (
    <View style={styles.stepRow}>
      {steps.map((label, i) => {
        const idx    = i + 1 as 1 | 2 | 3;
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

export default function FundBrokerageScreen() {
  const router = useRouter();

  const [exchange, setExchange] = useState<Exchange>('US');
  const [raw,      setRaw]      = useState('');

  const cfg      = EXCHANGE_CONFIG[exchange];
  const numeric  = parseFloat(raw || '0');
  const overMax  = numeric > cfg.max;
  const belowMin = numeric > 0 && numeric < cfg.min;
  const canContinue = numeric >= cfg.min && !overMax;

  // Format display — no leading zeros, max 2 decimal places
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
    // Block if already 2 decimal places
    if (raw.includes('.')) {
      const decimals = raw.split('.')[1];
      if (decimals && decimals.length >= 2) return;
    }
    if (raw.length >= 10) return;
    // Remove leading zero
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
    // ──────────────────────────────────────────────────────────────
    //router.push('/(protected)/brokerage/FundBrokerageReviewScreen' as any);
    router.push({
    pathname: '/(protected)/brokerage/FundBrokerageReviewScreen',
    params: {
      amount: String(numeric),
      exchange,
    },
  } as any);
  };

  // Hint text
  const hintText = overMax
    ? `Exceeds wallet balance (${cfg.symbol}${cfg.max.toLocaleString('en-NG', { maximumFractionDigits: 2 })})`
    : belowMin
    ? `Minimum is ${cfg.symbol}${cfg.min.toLocaleString('en-NG')}`
    : `Min ${cfg.symbol}${cfg.min.toLocaleString('en-NG')} · Max ${cfg.symbol}${cfg.max.toLocaleString('en-NG', { maximumFractionDigits: 2 })} (wallet balance)`;

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
          <Text style={styles.topTitle}>Fund brokerage</Text>
          <Text style={styles.topSub}>Wallet → Brokerage</Text>
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

          {/* ── Exchange selector ── */}
          <Text style={styles.sectionLbl}>Fund which brokerage?</Text>
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
                US Stocks
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
                NGX Stocks
              </Text>
              <Text style={[styles.excSub, exchange === 'NGX' && styles.excSubActive]}>
                Nigerian Exchange · NGN
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── From wallet source ── */}
          <View style={styles.sourceCard}>
            <View style={styles.sourceIco}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Rect x={2} y={7} width={20} height={14} rx={3}
                  stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
                <Path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"
                  stroke="#1D4ED8" strokeWidth={1.6} fill="none" />
              </Svg>
            </View>
            <View>
              <Text style={styles.sourceLbl}>From wallet</Text>
              <Text style={styles.sourceVal}>
                {cfg.walletLbl} · {cfg.symbol}
                {cfg.max.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available
              </Text>
            </View>
          </View>

          {/* ── Amount display ── */}
          <View style={styles.amtArea}>
            <Text style={styles.amtLabel}>HOW MUCH TO TRANSFER?</Text>
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
              style={[styles.chip, raw === String(cfg.max) && styles.chipActive]}
              onPress={() => handleChip(String(cfg.max))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipTxt, raw === String(cfg.max) && styles.chipTxtActive]}>
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

  // Top bar
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

  // Step bar
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
  stepLineDone: { backgroundColor: '#0F2419' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepDotActive: {
    backgroundColor: '#0F2419', borderColor: '#0F2419',
    shadowColor: '#0F2419',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  stepDotTxt:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLabel:   { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.2 },
  stepLabelOn: { color: '#0F2419' },

  // Section label
  sectionLbl: {
    fontSize: 12, fontWeight: '600', color: '#555',
    marginBottom: 10,
  },

  // Exchange selector
  excRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  excCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    borderColor: '#E8E8E8', backgroundColor: '#fff',
    padding: 12, gap: 2,
  },
  excCardActive: {
    borderColor: '#0F2419', borderWidth: 1.5,
    backgroundColor: '#F0FBF5',
  },
  excPrefix: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 0.5,
  },
  excPrefixActive: { color: '#0F2419' },
  excLabel: {
    fontSize: 13, fontWeight: '700', color: '#0A0A0A',
  },
  excLabelActive: { color: '#0F2419' },
  excSub:    { fontSize: 10, color: '#AAAAAA' },
  excSubActive: { color: '#2E7D32' },

  // Source card
  sourceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#E8E8E8',
    padding: 12, marginBottom: 20,
  },
  sourceIco: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sourceLbl: { fontSize: 11, color: '#AAAAAA' },
  sourceVal: { fontSize: 13, fontWeight: '700', color: '#0A0A0A', marginTop: 1 },

  // Amount display
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

  // Quick chips
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
    backgroundColor: '#0F2419', borderColor: '#0F2419',
  },
  chipTxt:       { fontSize: 12, fontWeight: '700', color: '#555' },
  chipTxtActive: { color: '#fff' },

  // Numpad
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

  // CTA
  ctaWrap: {
    paddingTop: 12,
  },
  cta: {
    backgroundColor: '#0A0A0A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#F0F0F0' },
  ctaTxt:         { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaTxtDisabled: { color: '#BBBBBB' },
});