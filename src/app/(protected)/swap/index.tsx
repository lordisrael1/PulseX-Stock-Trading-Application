/**
 * SwapAmountScreen.tsx
 * Step 1 of 3 — Currency swap amount entry. Matches rt.png's Quick Swap
 * widget, expanded into a full step screen. Bidirectional NGN<->USD.
 */

import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';

type Direction = 'NGN_TO_USD' | 'USD_TO_NGN';

const MOCK = {
  ngnBalance: 44678.32,
  usdBalance: 29.14,
  rate: 1533.20,
  spread: 0.3,
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

const NUMPAD_ROWS = [
  [{ k: '1', s: '' }, { k: '2', s: 'ABC' }, { k: '3', s: 'DEF' }],
  [{ k: '4', s: 'GHI' }, { k: '5', s: 'JKL' }, { k: '6', s: 'MNO' }],
  [{ k: '7', s: 'PQRS' }, { k: '8', s: 'TUV' }, { k: '9', s: 'WXYZ' }],
  [{ k: '.', s: '' }, { k: '0', s: '' }, { k: '⌫', s: '' }],
];

function Numpad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <View style={styles.numpad}>
      {NUMPAD_ROWS.map((row, ri) => (
        <View key={ri} style={styles.numRow}>
          {row.map(({ k, s }) => (
            <TouchableOpacity key={k} style={styles.numKey} onPress={() => onKey(k)} activeOpacity={0.5}>
              {k === '⌫' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-5 5M13 9l5 5"
                    stroke="#666" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              ) : (
                <View style={styles.numKeyInner}>
                  <Text style={styles.numKeyNum}>{k}</Text>
                  {s.length > 0 && <Text style={styles.numKeySub}>{s}</Text>}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function SwapAmountScreen() {
  const router = useRouter();

  const [direction, setDirection] = useState<Direction>('NGN_TO_USD');
  const [raw, setRaw] = useState('');

  const isNgnToUsd = direction === 'NGN_TO_USD';

  const fromCfg = isNgnToUsd
    ? { code: 'NGN', symbol: '₦', balance: MOCK.ngnBalance, color: '#2E7D32', bg: '#E8F5E9' }
    : { code: 'USD', symbol: '$', balance: MOCK.usdBalance, color: '#1D4ED8', bg: '#EFF6FF' };

  const toCfg = isNgnToUsd
    ? { code: 'USD', symbol: '$', color: '#1D4ED8', bg: '#EFF6FF' }
    : { code: 'NGN', symbol: '₦', color: '#2E7D32', bg: '#E8F5E9' };

  const numeric = parseFloat(raw || '0');
  const min = isNgnToUsd ? 500 : 1;
  const overMax = numeric > fromCfg.balance;
  const belowMin = numeric > 0 && numeric < min;
  const canContinue = numeric >= min && !overMax;

  const convertedAmount = useMemo(() => {
    if (!numeric) return 0;
    const effectiveRate = MOCK.rate * (1 + MOCK.spread / 100);
    return isNgnToUsd ? numeric / effectiveRate : numeric * (MOCK.rate * (1 - MOCK.spread / 100));
  }, [numeric, isNgnToUsd]);

  const fmtConverted = isNgnToUsd
    ? convertedAmount.toFixed(2)
    : convertedAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleKey = useCallback((k: string) => {
    if (k === '⌫') { setRaw(p => p.slice(0, -1)); return; }
    if (k === '.') {
      if (raw.includes('.')) return;
      setRaw(p => (p === '' ? '0.' : p + '.'));
      return;
    }
    if (raw.includes('.')) {
      const decimals = raw.split('.')[1];
      if (decimals && decimals.length >= 2) return;
    }
    if (raw.length >= 10) return;
    if (raw === '0') { setRaw(k); return; }
    setRaw(p => p + k);
  }, [raw]);

  const handleFlip = () => {
    setDirection(d => (d === 'NGN_TO_USD' ? 'USD_TO_NGN' : 'NGN_TO_USD'));
    setRaw('');
  };

  const handleMax = () => setRaw(String(fromCfg.balance));

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: '/(protected)/swap/review',
      params: { amount: String(numeric), direction },
    } as any);
  };

  const fromBalFmt = fromCfg.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hintText = overMax
    ? `Exceeds ${fromCfg.code} balance (${fromCfg.symbol}${fromBalFmt})`
    : belowMin
    ? `Minimum is ${fromCfg.symbol}${min.toLocaleString('en-NG')}`
    : `Min ${fromCfg.symbol}${min.toLocaleString('en-NG')} · Max ${fromCfg.symbol}${fromBalFmt} (wallet balance)`;

  const amtColor = overMax || belowMin ? '#DC2626' : '#0A0A0A';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Swap currency</Text>
          <Text style={styles.topSub}>{fromCfg.code} → {toCfg.code}</Text>
        </View>
        <Text style={styles.topStep}>Step 1 of 3</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <StepBar active={1} />

          <View style={styles.swapRow}>
            <View style={[styles.swapBox, { backgroundColor: fromCfg.bg, borderColor: fromCfg.color + '40' }]}>
              <Text style={[styles.swapDir, { color: fromCfg.color }]}>FROM</Text>
              <View style={styles.swapCurRow}>
                <Text style={[styles.swapCurSym, { color: fromCfg.color }]}>{fromCfg.symbol}</Text>
                <Text style={styles.swapCurCode}>{fromCfg.code}</Text>
              </View>
              <Text style={[styles.swapAmt, { color: fromCfg.color }]} numberOfLines={1}>
                {raw || '0'}
              </Text>
              <Text style={styles.swapBal}>Balance: {fromCfg.symbol}{fromBalFmt}</Text>
            </View>

            <TouchableOpacity style={styles.flipBtn} onPress={handleFlip} activeOpacity={0.75}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M7 16V4m0 0L3 8m4-4l4 4" stroke="#666" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                <Path d="M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#666" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
            </TouchableOpacity>

            <View style={[styles.swapBox, { backgroundColor: toCfg.bg, borderColor: toCfg.color + '40' }]}>
              <Text style={[styles.swapDir, { color: toCfg.color }]}>TO</Text>
              <View style={styles.swapCurRow}>
                <Text style={[styles.swapCurSym, { color: toCfg.color }]}>{toCfg.symbol}</Text>
                <Text style={styles.swapCurCode}>{toCfg.code}</Text>
              </View>
              <Text style={[styles.swapAmt, { color: toCfg.color }]} numberOfLines={1}>
                {raw ? fmtConverted : '0.00'}
              </Text>
              <Text style={styles.swapBal}>≈ live rate</Text>
            </View>
          </View>

          <View style={styles.rateBanner}>
            <View style={styles.rateBannerLeft}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.rateLbl}>Live rate</Text>
            </View>
            <View style={styles.rateBannerRight}>
              <Text style={styles.rateVal}>1 USD = ₦{MOCK.rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.livePill}>
                <Text style={styles.livePillTxt}>Live</Text>
              </View>
            </View>
          </View>

          <View style={styles.amtArea}>
            <Text style={styles.amtLabel}>HOW MUCH TO SWAP?</Text>
            <View style={styles.amtRow}>
              <Text style={[styles.amtSymbol, { color: raw ? amtColor : '#CCCCCC' }]}>{fromCfg.symbol}</Text>
              <Text style={[styles.amtVal, { color: raw ? amtColor : '#CCCCCC' }]}>{raw || '0'}</Text>
            </View>
            <Text style={[styles.amtHint, (overMax || belowMin) && styles.amtHintError]}>{hintText}</Text>
          </View>

          <View style={styles.chipsRow}>
            {(isNgnToUsd ? ['1000', '5000', '20000'] : ['10', '20', '50']).map(v => (
              <TouchableOpacity key={v} style={[styles.chip, raw === v && styles.chipActive]} onPress={() => setRaw(v)} activeOpacity={0.7}>
                <Text style={[styles.chipTxt, raw === v && styles.chipTxtActive]}>
                  {fromCfg.symbol}{parseFloat(v).toLocaleString('en-NG')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.chip, raw === String(fromCfg.balance) && styles.chipActive]} onPress={handleMax} activeOpacity={0.7}>
              <Text style={[styles.chipTxt, raw === String(fromCfg.balance) && styles.chipTxtActive]}>Max</Text>
            </TouchableOpacity>
          </View>

          <Numpad onKey={handleKey} />

          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
              disabled={!canContinue}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaTxt, !canContinue && styles.ctaTxtDisabled]}>Preview swap</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24 },
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
  swapRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 14 },
  swapBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12 },
  swapDir: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  swapCurRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  swapCurSym: { fontSize: 14, fontWeight: '700' },
  swapCurCode: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  swapAmt: { fontSize: 18, fontWeight: '500', letterSpacing: -0.3, marginBottom: 6 },
  swapBal: { fontSize: 9, color: '#999' },
  flipBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', flexShrink: 0,
  },
  rateBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, padding: 10, marginBottom: 22,
  },
  rateBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rateLbl: { fontSize: 12, color: '#888' },
  rateBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateVal: { fontSize: 12, fontWeight: '600', color: '#0A0A0A' },
  livePill: { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  livePillTxt: { fontSize: 10, fontWeight: '700', color: '#166634' },
  amtArea: { alignItems: 'center', marginBottom: 16 },
  amtLabel: { fontSize: 11, fontWeight: '700', color: '#CCCCCC', letterSpacing: 1.5, marginBottom: 12 },
  amtRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  amtSymbol: { fontSize: 22, fontWeight: '500', marginTop: 8 },
  amtVal: { fontSize: 52, fontWeight: '500', letterSpacing: -2, lineHeight: 58 },
  amtHint: { fontSize: 12, color: '#AAAAAA', marginTop: 8 },
  amtHintError: { color: '#DC2626', fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipTxt: { fontSize: 12, fontWeight: '700', color: '#555' },
  chipTxtActive: { color: '#fff' },
  numpad: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden' },
  numRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  numKey: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.5, borderRightColor: '#F0F0F0', minHeight: 58 },
  numKeyInner: { alignItems: 'center', gap: 2 },
  numKeyNum: { fontSize: 22, fontWeight: '400', color: '#0A0A0A', lineHeight: 26 },
  numKeySub: { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.8 },
  ctaWrap: { paddingTop: 12 },
  cta: { backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: '#F0F0F0' },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaTxtDisabled: { color: '#BBBBBB' },
});