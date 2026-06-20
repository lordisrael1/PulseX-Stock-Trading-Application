/**
 * WalletScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Matches 4.png + 5.png — one combined screen.
 *
 * KYC GATE:
 *   - If KYC is not fully verified (all 4 steps = 'verified'),
 *     the wallet is LOCKED. User sees a gate screen explaining why,
 *     with a CTA to complete KYC.
 *   - Once all 4 steps are verified, the full wallet UI unlocks.
 *   - In production: pull kycStatus from Redux store / API.
 *     Replace MOCK_KYC with:
 *     const kycStatus = useSelector((s: RootState) => s.auth.user?.kycStatus)
 *
 * API INTEGRATION POINTS:
 *   → fetchWalletBalance()     — replace TODO in loadWallet()
 *   → fetchTransactions()      — replace TODO in loadWallet()
 *   → fetchLiveRate()          — replace TODO in loadRate()
 *   → previewSwap(amount, dir) — replace TODO in handlePreviewSwap()
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── KYC Types (mirror your authSlice) ───────────────────────────────────────

type KYCStep = 'verified' | 'pending' | 'failed' | 'none';

interface KYCStatus {
  bvn:     KYCStep;
  id:      KYCStep;
  selfie:  KYCStep;
  address: KYCStep;
}

// ─── MOCK — replace with Redux selector in production ─────────────────────────
// const kycStatus = useSelector((s: RootState) => s.auth.user?.kycStatus) ?? MOCK_KYC;

const MOCK_KYC: KYCStatus = {
  bvn:     'verified',
  id:      'verified',
  selfie:  'verified',
  address: 'verified',
  // Change any to 'none' / 'pending' / 'failed' to test the gate
};

function isKYCComplete(kyc: KYCStatus): boolean {
  return Object.values(kyc).every(v => v === 'verified');
}

// ─── Mock wallet data — replace with API ──────────────────────────────────────

const MOCK_WALLET = {
  ngnBalance: 44_678.32,
  usdBalance: 29.14,
  liveRate:   1_533.20,
  spread:     0.3,
};

interface Transaction {
  id:     string;
  type:   'deposit' | 'withdraw' | 'swap';
  label:  string;
  sub:    string;
  amount: string;
  color:  string;
}

const MOCK_TXS: Transaction[] = [
  { id:'t1', type:'deposit',  label:'Deposit — GTBank',  sub:'Today · 09:14 · NIBSS',  amount:'+₦50,000', color:'#166634' },
  { id:'t2', type:'swap',     label:'Swap NGN → USD',   sub:'Yesterday · 14:30',       amount:'$20.00',   color:'#1D4ED8' },
  { id:'t3', type:'withdraw', label:'Withdraw — UBA',   sub:'Jun 9 · 16:22 · NIBSS',  amount:'-₦20,000', color:'#DC2626' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNGN(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── KYC Gate Screen ──────────────────────────────────────────────────────────

function KYCGate({ kyc, onGoKYC }: { kyc: KYCStatus; onGoKYC: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const steps = [
    { key: 'bvn',     label: 'BVN verification' },
    { key: 'id',      label: 'Government ID'    },
    { key: 'selfie',  label: 'Selfie check'     },
    { key: 'address', label: 'Address proof'    },
  ] as const;

  const totalDone = Object.values(kyc).filter(v => v === 'verified').length;

  return (
    <Animated.View style={[gateStyles.wrap, { opacity: fadeAnim }]}>
      {/* Lock icon */}
      <View style={gateStyles.iconWrap}>
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <Svg width={32} height={32} viewBox="0 0 24 24">
            <Path
              d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
              stroke="#0F2419" strokeWidth={1.8} fill="none"
            />
            <Path
              d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="#0F2419" strokeWidth={1.8} strokeLinecap="round" fill="none"
            />
            <Circle cx={12} cy={16} r={1.5} fill="#0F2419" />
          </Svg>
        </Svg>
      </View>

      <Text style={gateStyles.title}>Wallet locked</Text>
      <Text style={gateStyles.sub}>
        Your wallet will be created once you complete identity verification. This is required by CBN regulation for all investment accounts.
      </Text>

      {/* Progress */}
      <View style={gateStyles.progressCard}>
        <View style={gateStyles.progressHeader}>
          <Text style={gateStyles.progressLabel}>KYC progress</Text>
          <Text style={gateStyles.progressCount}>{totalDone}/4 complete</Text>
        </View>
        <View style={gateStyles.progressTrack}>
          <View style={[gateStyles.progressFill, { width: `${(totalDone / 4) * 100}%` as any }]} />
        </View>
        <View style={gateStyles.stepList}>
          {steps.map((s) => {
            const status = kyc[s.key];
            const done   = status === 'verified';
            const failed = status === 'failed';
            const pending= status === 'pending';
            return (
              <View key={s.key} style={gateStyles.stepRow}>
                <View style={[
                  gateStyles.stepDot,
                  done    && gateStyles.stepDotDone,
                  failed  && gateStyles.stepDotFail,
                  pending && gateStyles.stepDotPend,
                ]}>
                  {done ? (
                    <Svg width={10} height={10} viewBox="0 0 24 24">
                      <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                    </Svg>
                  ) : failed ? (
                    <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' }}>✕</Text>
                  ) : (
                    <Text style={[gateStyles.stepDotTxt, pending && { color: '#fff' }]}>
                      {['bvn','id','selfie','address'].indexOf(s.key) + 1}
                    </Text>
                  )}
                </View>
                <Text style={[gateStyles.stepLbl, done && gateStyles.stepLblDone]}>
                  {s.label}
                </Text>
                <Text style={[
                  gateStyles.stepStatus,
                  done    && { color: '#166634' },
                  failed  && { color: '#DC2626' },
                  pending && { color: '#92400E' },
                ]}>
                  {done ? 'Verified' : failed ? 'Failed' : pending ? 'Pending' : 'Not done'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={gateStyles.cta} onPress={onGoKYC} activeOpacity={0.85}>
        <Text style={gateStyles.ctaTxt}>Complete identity verification</Text>
      </TouchableOpacity>

      <View style={gateStyles.secRow}>
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
            stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
        </Svg>
        <Text style={gateStyles.secTxt}>CBN regulated · NDIC insured</Text>
      </View>
    </Animated.View>
  );
}

const gateStyles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.3, marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 12, color: '#AAAAAA', textAlign: 'center', lineHeight: 19, marginBottom: 24, paddingHorizontal: 8 },
  progressCard: {
    width: '100%', backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB', padding: 16, marginBottom: 20,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#0A0A0A' },
  progressCount: { fontSize: 11, color: '#AAAAAA' },
  progressTrack: { height: 4, backgroundColor: '#E8E8E8', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progressFill:  { height: 4, backgroundColor: '#0F2419', borderRadius: 2 },
  stepList: { gap: 10 },
  stepRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepDotDone: { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepDotFail: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  stepDotPend: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  stepDotTxt:  { fontSize: 9, fontWeight: '700', color: '#AAAAAA' },
  stepLbl:     { flex: 1, fontSize: 12, color: '#AAAAAA' },
  stepLblDone: { color: '#0A0A0A', fontWeight: '600' },
  stepStatus:  { fontSize: 11, fontWeight: '600', color: '#AAAAAA' },
  cta: {
    width: '100%', backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 14,
  },
  ctaTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  secTxt: { fontSize: 11, color: '#CCCCCC' },
});

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: Transaction }) {
  const iconMap = {
    deposit:  { icon: 'ti-arrow-down-left', bg: '#E8F5E9', color: '#2E7D32' },
    withdraw: { icon: 'ti-arrow-up-right',  bg: '#FEF2F2', color: '#DC2626' },
    swap:     { icon: 'ti-arrows-exchange', bg: '#EFF6FF', color: '#1D4ED8' },
  };
  const cfg = iconMap[tx.type];
  return (
    <View style={txStyles.row}>
      <View style={[txStyles.ico, { backgroundColor: cfg.bg }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          {tx.type === 'deposit' && (
            <Path d="M12 19V5M5 12l7 7 7-7" stroke={cfg.color} strokeWidth={2} strokeLinecap="round" fill="none" />
          )}
          {tx.type === 'withdraw' && (
            <Path d="M12 5v14M5 12l7-7 7 7" stroke={cfg.color} strokeWidth={2} strokeLinecap="round" fill="none" />
          )}
          {tx.type === 'swap' && (
            <>
              <Path d="M7 16V4m0 0L3 8m4-4l4 4" stroke={cfg.color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
              <Path d="M17 8v12m0 0l4-4m-4 4l-4-4" stroke={cfg.color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </>
          )}
        </Svg>
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.label}>{tx.label}</Text>
        <Text style={txStyles.sub}>{tx.sub}</Text>
      </View>
      <Text style={[txStyles.amount, { color: tx.color }]}>{tx.amount}</Text>
    </View>
  );
}

const txStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5', gap: 10 },
  ico:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info:   { flex: 1 },
  label:  { fontSize: 12, fontWeight: '600', color: '#0A0A0A' },
  sub:    { fontSize: 10, color: '#AAAAAA', marginTop: 1 },
  amount: { fontSize: 12, fontWeight: '700' },
});

// ─── Main Wallet Screen ───────────────────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();

  // ── In production: pull from Redux ───────────────────────────────
  // const kycStatus = useSelector((s: RootState) => s.auth.user?.kycStatus) ?? MOCK_KYC;
  const kycStatus = MOCK_KYC;
  // ─────────────────────────────────────────────────────────────────

  const walletUnlocked = isKYCComplete(kycStatus);

  const [activeCur,  setActiveCur]  = useState<'NGN' | 'USD'>('NGN');
  const [swapAmt,    setSwapAmt]    = useState('1,533.20');
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // ── TODO: fetchWalletBalance() + fetchTransactions() + fetchLiveRate()
    await new Promise(r => setTimeout(r, 900));
    setRefreshing(false);
  };

  const handlePreviewSwap = () => {
    // ── TODO: previewSwap(swapAmt, activeCur === 'NGN' ? 'NGN_USD' : 'USD_NGN')
    router.push('/(protected)/swap' as any);
  };

  const ngnBal = MOCK_WALLET.ngnBalance;
  const usdBal = MOCK_WALLET.usdBalance;
  const rate   = MOCK_WALLET.liveRate;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      {/* <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Wallet</Text>
          <Text style={styles.topSub}>PulseX Cash Account</Text>
        </View>
        <TouchableOpacity style={styles.histBtn} activeOpacity={0.7}
          onPress={() => router.push('/(protected)/wallet/history' as any)}>
          <Svg width={17} height={17} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.8} fill="none" />
            <Path d="M12 7v5l3 3" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
      </Animated.View> */}

      {/* ── KYC Gate — shown when wallet is locked ── */}
      {!walletUnlocked ? (
        <KYCGate
          kyc={kycStatus}
          onGoKYC={() => router.push('/(auth)/kyc/bvn' as any)}
        />
      ) : (
        /* ── Full Wallet UI ── */
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor="#0F2419" colors={['#0F2419']} />
          }
        >
          {/* ── Balance hero ── */}
          <View style={styles.balanceWrap}>
            <Text style={styles.balanceLbl}>TOTAL WALLET BALANCE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceCur}>₦</Text>
              <Text style={styles.balanceMain}>
                {Math.floor(ngnBal).toLocaleString('en-NG')}
              </Text>
              <Text style={styles.balanceDec}>
                .{ngnBal.toFixed(2).split('.')[1]}
              </Text>
            </View>
            <Text style={styles.balanceEq}>≈ {fmtUSD(usdBal)} USD</Text>
          </View>

          {/* ── Currency tabs ── */}
          <View style={styles.curTabs}>
            <TouchableOpacity
              style={[styles.curTab, activeCur === 'NGN' && styles.curTabActive]}
              onPress={() => setActiveCur('NGN')} activeOpacity={0.75}
            >
              <Text style={[styles.curTabLabel, activeCur === 'NGN' && styles.curTabLabelActive]}>
                NGN ₦
              </Text>
              <Text style={[styles.curTabAmt, activeCur === 'NGN' && styles.curTabAmtActive]}>
                {ngnBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.curTab, activeCur === 'USD' && styles.curTabActive]}
              onPress={() => setActiveCur('USD')} activeOpacity={0.75}
            >
              <Text style={[styles.curTabLabel, activeCur === 'USD' && styles.curTabLabelActive]}>
                USD $
              </Text>
              <Text style={[styles.curTabAmt, activeCur === 'USD' && styles.curTabAmtActive]}>
                {usdBal.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Action buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn}
              onPress={() => router.push('/(protected)/payment/deposit' as any)}
              activeOpacity={0.75}>
              <View style={[styles.actionIco, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M12 19V5M5 12l7 7 7-7" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <Text style={styles.actionLbl}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}
              onPress={() => router.push('/(protected)/payment/withdraw' as any)}
              activeOpacity={0.75}>
              <View style={[styles.actionIco, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M12 5v14M5 12l7-7 7 7" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <Text style={styles.actionLbl}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}
              onPress={handlePreviewSwap}
              activeOpacity={0.75}>
              <View style={[styles.actionIco, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M7 16V4m0 0L3 8m4-4l4 4" stroke="#1D4ED8" strokeWidth={2} strokeLinecap="round" fill="none" />
                  <Path d="M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#1D4ED8" strokeWidth={2} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <Text style={styles.actionLbl}>Swap</Text>
            </TouchableOpacity>
          </View>

          {/* ── Live rate banner ── */}
          <View style={styles.rateBanner}>
            <View style={styles.rateBannerLeft}>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.rateLbl}>Live rate</Text>
            </View>
            <View style={styles.rateBannerRight}>
              <Text style={styles.rateVal}>1 USD = ₦{rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.livePill}>
                <Text style={styles.livePillTxt}>Live</Text>
              </View>
            </View>
          </View>

          {/* ── Wallet breakdown ── */}
          <Text style={styles.secLbl}>WALLET BREAKDOWN</Text>
          <View style={styles.card}>
            <View style={styles.breakRow}>
              <View style={[styles.breakIco, { backgroundColor: '#E8F5E9' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="#2E7D32" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.breakInfo}>
                <Text style={styles.breakName}>Nigerian Naira</Text>
                <Text style={styles.breakSub}>Available to deposit · withdraw · swap</Text>
              </View>
              <View style={styles.breakAmts}>
                <Text style={styles.breakAmt}>{fmtNGN(ngnBal)}</Text>
                <Text style={styles.breakEq}>≈ {fmtUSD(ngnBal / rate)}</Text>
              </View>
            </View>
            <View style={styles.breakDivider} />
            <View style={styles.breakRow}>
              <View style={[styles.breakIco, { backgroundColor: '#EFF6FF' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="#1D4ED8" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.breakInfo}>
                <Text style={styles.breakName}>US Dollar</Text>
                <Text style={styles.breakSub}>Fund US brokerage · swap to NGN</Text>
              </View>
              <View style={styles.breakAmts}>
                <Text style={styles.breakAmt}>{fmtUSD(usdBal)}</Text>
                <Text style={styles.breakEq}>≈ {fmtNGN(usdBal * rate)}</Text>
              </View>
            </View>
          </View>
           {/* ── Brokerage ── */}
          <Text style={styles.secLbl}>Brokerage</Text>
          <TouchableOpacity onPress={() => router.push('/(protected)/brokerage/' as any)} style={styles.card}>
            <View style={styles.breakRow}>
              <View style={[styles.breakIco, { backgroundColor: '#E8F5E9' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="#2e367d" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.breakInfo}>
                <Text style={styles.breakName}>Brokerage</Text>
                <Text style={styles.breakSub}>Available brokerage funds</Text>
              </View>
            </View>
            <View style={styles.breakDivider} />
          </TouchableOpacity>

          {/* ── Quick swap ── */}
          <Text style={styles.secLbl}>QUICK SWAP</Text>
          <View style={[styles.card, styles.swapCard]}>
            {/* From / To boxes */}
            <View style={styles.swapRow}>
              {/* FROM */}
              <View style={styles.swapBox}>
                <Text style={styles.swapDir}>FROM</Text>
                <View style={styles.swapCurRow}>
                  <View style={[styles.swapCurDot, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.swapCurSym, { color: '#2E7D32' }]}>₦</Text>
                  </View>
                  <Text style={styles.swapCurCode}>NGN</Text>
                </View>
                <Text style={styles.swapAmt}>{swapAmt}</Text>
              </View>

              {/* Swap icon */}
              <TouchableOpacity style={styles.swapArrow} activeOpacity={0.7}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M7 16V4m0 0L3 8m4-4l4 4" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                  <Path d="M17 8v12m0 0l4-4m-4 4l-4-4" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
              </TouchableOpacity>

              {/* TO */}
              <View style={[styles.swapBox, styles.swapBoxTo]}>
                <Text style={[styles.swapDir, { color: '#1D4ED8' }]}>TO</Text>
                <View style={styles.swapCurRow}>
                  <View style={[styles.swapCurDot, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.swapCurSym, { color: '#1D4ED8' }]}>$</Text>
                  </View>
                  <Text style={[styles.swapCurCode, { color: '#1D4ED8' }]}>USD</Text>
                </View>
                <Text style={[styles.swapAmt, { color: '#1D4ED8' }]}>1.00</Text>
              </View>
            </View>

            <Text style={styles.swapRate}>
              Rate: ₦{rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })} / USD · Spread: {MOCK_WALLET.spread}%
            </Text>

            <TouchableOpacity style={styles.swapCta} onPress={handlePreviewSwap} activeOpacity={0.85}>
              <Text style={styles.swapCtaTxt}>Preview swap</Text>
            </TouchableOpacity>
          </View>

          {/* ── Recent transactions ── */}
          <Text style={styles.secLbl}>RECENT TRANSACTIONS</Text>
          <View style={[styles.card, { paddingVertical: 0 }]}>
            {MOCK_TXS.map((tx, i) => (
              <View key={tx.id} style={i < MOCK_TXS.length - 1 ? undefined : { borderBottomWidth: 0 }}>
                <TxRow tx={tx} />
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewAllRow}
              onPress={() => router.push('/(protected)/wallet/history' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllTxt}>View all transactions</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M9 18l6-6-6-6" stroke="#1D4ED8" strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* ── Security footer ── */}
          <View style={styles.secFooter}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
                stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
            </Svg>
            <Text style={styles.secFooterTxt}>CBN regulated · NDIC insured · 256-bit TLS</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { flex: 1 },
  topTitle:  { fontSize: 15, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:    { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  histBtn:   { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  // Balance hero
  balanceWrap: { alignItems: 'center', marginBottom: 18 },
  balanceLbl:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 8 },
  balanceRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  balanceCur:  { fontSize: 18, fontWeight: '500', color: '#AAAAAA', marginTop: 8 },
  balanceMain: { fontSize: 44, fontWeight: '500', color: '#0A0A0A', letterSpacing: -1.5, lineHeight: 50 },
  balanceDec:  { fontSize: 20, fontWeight: '500', color: '#AAAAAA', marginTop: 12 },
  balanceEq:   { fontSize: 12, color: '#AAAAAA', marginTop: 6 },

  // Currency tabs
  curTabs: {
    flexDirection: 'row', backgroundColor: '#EFEFEF',
    borderRadius: 12, padding: 3, marginBottom: 18, gap: 3,
  },
  curTab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', gap: 2 },
  curTabActive: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0' },
  curTabLabel:  { fontSize: 12, fontWeight: '500', color: '#AAAAAA' },
  curTabLabelActive: { color: '#0A0A0A' },
  curTabAmt:    { fontSize: 11, color: '#AAAAAA' },
  curTabAmtActive: { color: '#0A0A0A', fontWeight: '600' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 14, justifyContent: 'center' },
  actionBtn: { alignItems: 'center', gap: 7 },
  actionIco: {
    width: 50, height: 50, borderRadius: 15,
    borderWidth: 0.5, alignItems: 'center', justifyContent: 'center',
  },
  actionLbl: { fontSize: 11, fontWeight: '500', color: '#0A0A0A' },

  // Rate banner
  rateBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, padding: 10, marginBottom: 18,
  },
  rateBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rateLbl:         { fontSize: 12, color: '#888' },
  rateBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateVal:         { fontSize: 12, fontWeight: '600', color: '#0A0A0A' },
  livePill:        { backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  livePillTxt:     { fontSize: 10, fontWeight: '700', color: '#166634' },

  // Shared card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden', marginBottom: 18,
  },
  secLbl: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.2, marginBottom: 10 },

  // Breakdown
  breakRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  breakIco: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  breakInfo: { flex: 1 },
  breakName: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  breakSub:  { fontSize: 10, color: '#AAAAAA', marginTop: 1 },
  breakAmts: { alignItems: 'flex-end' },
  breakAmt:  { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  breakEq:   { fontSize: 10, color: '#AAAAAA', marginTop: 1 },
  breakDivider: { height: 0.5, backgroundColor: '#F0F0F0' },

  // Quick swap
  swapCard: { padding: 14 },
  swapRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  swapBox:  {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E8E8E8', padding: 10,
  },
  swapBoxTo: { borderColor: '#BFDBFE', backgroundColor: '#F0F6FF' },
  swapDir:   { fontSize: 10, color: '#AAAAAA', marginBottom: 6 },
  swapCurRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  swapCurDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  swapCurSym: { fontSize: 10, fontWeight: '700' },
  swapCurCode:{ fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  swapAmt:    { fontSize: 18, fontWeight: '500', color: '#0A0A0A', letterSpacing: -0.3 },
  swapArrow: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    borderWidth: 0.5, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  swapRate: { fontSize: 11, color: '#AAAAAA', textAlign: 'center', marginBottom: 12 },
  swapCta: {
    backgroundColor: '#1D4ED8', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  swapCtaTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // View all
  viewAllRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#F5F5F5',
  },
  viewAllTxt: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },

  // Footer
  secFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  secFooterTxt: { fontSize: 11, color: '#CCCCCC' },
});