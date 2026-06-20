import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const QUICK_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];
const DAILY_LIMIT = 5_000_000;
const MIN_AMOUNT = 500;
const WALLET_BALANCE = 44_678.32;

function fmt(n: number) {
  return n.toLocaleString('en-NG');
}

export default function DepositScreen() {
  const router = useRouter();
  const [raw, setRaw] = useState('');

  const numeric = raw ? parseInt(raw, 10) : 0;
  const overLimit = numeric > DAILY_LIMIT;
  const belowMin = numeric > 0 && numeric < MIN_AMOUNT;
  const canContinue = numeric >= MIN_AMOUNT && !overLimit;

  const tap = useCallback(
    (key: string) => {
      if (key === '⌫') {
        setRaw(p => p.slice(0, -1));
        return;
      }
      if (key === '.') return;
      if (raw.length >= 8) return;
      setRaw(p => p + key);
    },
    [raw],
  );

  const pickQuick = (amount: number) => setRaw(String(amount));

  const displayAmt = raw ? fmt(parseInt(raw, 10)) : '0';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Tab Row ── */}
      <View style = {styles.tabRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#555" />
        </TouchableOpacity>
      </View>
      {/* <View style={styles.tabRow}>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTextActive}>Deposit</Text>
        </View>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.replace('/payment/withdraw')}
          activeOpacity={0.75}
        >
          <Text style={styles.tabText}>Withdraw</Text>
        </TouchableOpacity>
      </View> */}

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Add money</Text>
        <Text style={styles.screenSub}>
          Wallet balance: ₦{WALLET_BALANCE.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {/* ── Step Bar ── */}
      <StepBar active={1} mode="dep" />

      {/* ── Amount Display ── */}
      <View style={styles.amtArea}>
        <Text style={styles.amtHint}>HOW MUCH TO DEPOSIT?</Text>

        <View style={styles.amtRow}>
          <Text style={[styles.amtSymbol, !raw && styles.amtDim]}>₦</Text>
          <Text
            style={[
              styles.amtVal,
              !raw && styles.amtDim,
              overLimit && styles.amtError,
            ]}
          >
            {displayAmt}
          </Text>
        </View>

        {overLimit ? (
          <Text style={styles.limitError}>Exceeds daily limit of ₦5,000,000</Text>
        ) : belowMin ? (
          <Text style={styles.limitError}>Minimum deposit is ₦500</Text>
        ) : (
          <Text style={styles.limitHint}>
            Daily limit:{' '}
            <Text style={styles.limitHighlight}>₦5,000,000</Text>
            {'  '}Min: ₦500
          </Text>
        )}
      </View>

      {/* ── Quick Amount Chips ── */}
      <View style={styles.chips}>
        {QUICK_AMOUNTS.map(a => (
          <TouchableOpacity
            key={a}
            onPress={() => pickQuick(a)}
            style={[styles.chip, raw === String(a) && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, raw === String(a) && styles.chipTextActive]}>
              ₦{fmt(a)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Numpad ── */}
      <Numpad onKey={tap} />

      {/* ── CTA ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/payment/deposit/method', params: { amount: String(numeric) } })}
        >
          <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Numpad ──────────────────────────────────────────────────────────────────

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

function Numpad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <View style={styles.numpad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.numRow}>
          {row.map(k => (
            <TouchableOpacity
              key={k}
              style={styles.numKey}
              onPress={() => onKey(k)}
              activeOpacity={0.5}
            >
              {k === '⌫' ? (
                <Text style={styles.numKeyDel}>⌫</Text>
              ) : k === '.' ? (
                <Text style={styles.numKeyDot}>·</Text>
              ) : (
                <Text style={styles.numKeyNum}>{k}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Step Bar ────────────────────────────────────────────────────────────────

function StepBar({ active, mode }: { active: 1 | 2 | 3; mode: 'dep' | 'wit' }) {
  const accentColor = mode === 'dep' ? '#113322' : '#221133';
  const steps = ['Amount', 'Method', 'Confirm'];
  return (
    <View style={styles.stepRow}>
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < active;
        const cur = idx === active;
        return (
          <View key={s} style={styles.stepItem}>
            {i > 0 && (
              <View
                style={[
                  styles.stepLine,
                  (done || cur) && { backgroundColor: accentColor },
                ]}
              />
            )}
            <View
              style={[
                styles.stepDot,
                (done || cur) && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
            >
              <Text style={[styles.stepDotText, (done || cur) && { color: '#fff' }]}>
                {done ? '✓' : idx}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                (done || cur) && { color: accentColor },
              ]}
            >
              {s}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff'},

  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center'},
  // Tab
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#113322', borderColor: '#113322'},
  tabText: { fontSize: 14, fontWeight: '700', color: '#AAAAAA' },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 3,
  },

  // Step bar
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
    marginRight: 5,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#AAAAAA',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CCCCCC',
    letterSpacing: 0.2,
  },

  // Amount area
  amtArea: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  amtHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CCCCCC',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  amtRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
  },
  amtSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A0A0A',
    marginTop: 8,
  },
  amtVal: {
    fontSize: 52,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -2,
    lineHeight: 58,
  },
  amtDim: {
    color: '#CCCCCC',
  },
  amtError: {
    color: '#DC2626',
  },
  limitHint: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 8,
  },
  limitHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  limitError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontWeight: '600',
  },

  // Quick chips
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#113322',
    borderColor: '#113322',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555555',
  },
  chipTextActive: {
    color: '#fff',
  },

  // Numpad
  numpad: {
    flex: 1,
    paddingHorizontal: 0,
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
  },
  numKeyNum: {
    fontSize: 22,
    fontWeight: '400',
    color: '#0A0A0A',
  },
  numKeyDot: {
    fontSize: 28,
    fontWeight: '700',
    color: '#CCCCCC',
    lineHeight: 28,
  },
  numKeyDel: {
    fontSize: 20,
    color: '#888',
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
  },
  cta: {
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#F0F0F0',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  ctaTextDisabled: {
    color: '#BBBBBB',
  },
});