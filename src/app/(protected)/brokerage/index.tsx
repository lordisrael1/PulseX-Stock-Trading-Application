/**
 * BrokerageScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Matches 13.png (top) + 900.png (bottom) — one full screen.
 *
 * Features:
 *  - US / NGX exchange toggle
 *  - Buying power hero card with Fund + Withdraw CTAs
 *  - Cash breakdown (buying power, unsettled, reserved, total)
 *  - "Withdraw buying power to wallet" info banner
 *  - Portfolio holdings list
 *  - "View all holdings" link
 *  - Order history row
 *
 * API / STATE:
 *  → Pull from Redux: brokerage slice per exchange
 *  → Replace MOCK_DATA with useSelector(s => s.brokerage[exchange])
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type Exchange = 'US' | 'NGX';

interface BrokerageData {
  buyingPower:    number;
  unsettled:      number;
  unsettledDate:  string;
  reserved:       number;
  reservedOrders: number;
  totalValue:     number;
  currency:       '$' | '₦';
  marketLabel:    string;
  orderCount:     number;
  orderLastDate:  string;
  holdings: { ticker: string; name: string; qty: number; avg: number; value: number; gain: number }[];
}

// ─── Mock data — replace with Redux selectors ─────────────────────────────────

const MOCK: Record<Exchange, BrokerageData> = {
  US: {
    buyingPower:    1240.00,
    unsettled:      364.20,
    unsettledDate:  'Jun 12',
    reserved:       498.60,
    reservedOrders: 2,
    totalValue:     2102.80,
    currency:       '$',
    marketLabel:    'Available to trade on NYSE · NASDAQ',
    orderCount:     247,
    orderLastDate:  'Today',
    holdings: [
      { ticker: 'NVDA', name: 'NVIDIA Corp',  qty: 3, avg: 872.40, value: 2673.60, gain: 54.60  },
      { ticker: 'AAPL', name: 'Apple Inc',    qty: 5, avg: 186.20, value: 947.50,  gain: 16.50  },
    ],
  },
  NGX: {
    buyingPower:    182340.00,
    unsettled:      24250.00,
    unsettledDate:  'Jun 14',
    reserved:       0,
    reservedOrders: 0,
    totalValue:     206590.00,
    currency:       '₦',
    marketLabel:    'Available to trade on NGX · Lagos',
    orderCount:     14,
    orderLastDate:  'Jun 9',
    holdings: [
      { ticker: 'GTCO',    name: 'GT Holdings',     qty: 500, avg: 48.50,  value: 24250.00, gain: 0       },
      { ticker: 'DANGCEM', name: 'Dangote Cement',  qty: 100, avg: 440.00, value: 45200.00, gain: 1200.00 },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, cur: '$' | '₦') {
  return `${cur}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Cash Breakdown Row ───────────────────────────────────────────────────────

function CashRow({
  icon,
  label,
  sub,
  value,
  valueColor,
  subRight,
  subRightColor,
  onSubRightPress,
}: {
  icon:              React.ReactNode;
  label:             string;
  sub:               string;
  value:             string;
  valueColor?:       string;
  subRight?:         string;
  subRightColor?:    string;
  onSubRightPress?:  () => void;
}) {
  return (
    <View style={styles.cashRow}>
      <View style={styles.cashIco}>{icon}</View>
      <View style={styles.cashInfo}>
        <Text style={styles.cashLabel}>{label}</Text>
        <Text style={styles.cashSub}>{sub}</Text>
      </View>
      <View style={styles.cashRight}>
        <Text style={[styles.cashValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
        {subRight ? (
          <TouchableOpacity onPress={onSubRightPress} activeOpacity={0.7}>
            <Text style={[styles.cashSubRight, subRightColor ? { color: subRightColor } : null]}>
              {subRight}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── Holding Row ──────────────────────────────────────────────────────────────

function HoldingRow({
  holding,
  currency,
  onPress,
}: {
  holding:  BrokerageData['holdings'][0];
  currency: '$' | '₦';
  onPress:  () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 280, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.holdingRow} onPress={onPress} activeOpacity={0.72}>
        <View style={styles.holdingBadge}>
          <Text style={styles.holdingTicker}>{holding.ticker.slice(0, 4)}</Text>
        </View>
        <View style={styles.holdingInfo}>
          <Text style={styles.holdingName}>{holding.name}</Text>
          <Text style={styles.holdingSub}>
            {holding.qty} shares · avg {currency}{holding.avg.toFixed(2)}
          </Text>
        </View>
        <View style={styles.holdingRight}>
          <Text style={styles.holdingValue}>{fmt(holding.value, currency)}</Text>
          <Text style={[styles.holdingGain, { color: holding.gain >= 0 ? '#166634' : '#DC2626' }]}>
            {holding.gain >= 0 ? '+' : ''}{fmt(holding.gain, currency)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BrokerageScreen() {
  const router = useRouter();

  const [exchange, setExchange] = useState<Exchange>('US');
  const d = MOCK[exchange];

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1, duration: 420, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(protected)/(tabs)/wallet') as any} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Brokerage</Text>
          <Text style={styles.topSub}>Trading account</Text>
        </View>
        <TouchableOpacity
          style={styles.histBtn}
          onPress={() => router.push(`/(protected)/brokerage/history?exchange=${exchange}` as any)}
          activeOpacity={0.7}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.8} fill="none" />
            <Path d="M12 7v5l3 3" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Exchange toggle ── */}
      <View style={styles.excToggle}>
        <TouchableOpacity
          style={[styles.excBtn, exchange === 'US' && styles.excBtnActive]}
          onPress={() => setExchange('US')}
          activeOpacity={0.75}
        >
          <Text style={[styles.excBtnPrefix, exchange === 'US' && styles.excBtnPrefixActive]}>us</Text>
          <Text style={[styles.excBtnLabel, exchange === 'US' && styles.excBtnLabelActive]}>
            US Stocks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.excBtn, exchange === 'NGX' && styles.excBtnActive]}
          onPress={() => setExchange('NGX')}
          activeOpacity={0.75}
        >
          <Text style={[styles.excBtnPrefix, exchange === 'NGX' && styles.excBtnPrefixActive]}>NG</Text>
          <Text style={[styles.excBtnLabel, exchange === 'NGX' && styles.excBtnLabelActive]}>
            NGX Stocks
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Buying power hero ── */}
        <View style={styles.bpCard}>
          <Text style={styles.bpLabel}>BUYING POWER</Text>
          <Text style={styles.bpAmount}>{fmt(d.buyingPower, d.currency)}</Text>
          <Text style={styles.bpSub}>{d.marketLabel}</Text>

          <View style={styles.bpActions}>
            <TouchableOpacity
              style={styles.bpFundBtn}
              onPress={() => router.push('/(protected)/brokerage/fundbrokerage' as any)}
              activeOpacity={0.75}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 19V5M5 12l7 7 7-7"
                  stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.bpFundTxt}>Fund</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bpWithdrawBtn}
              onPress={() => router.push('/(protected)/brokerage/withdrawbrokerage' as any)}
              activeOpacity={0.75}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 5v14M5 12l7-7 7 7"
                  stroke="#DC2626" strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.bpWithdrawTxt}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cash breakdown ── */}
        <Text style={styles.secLbl}>CASH BREAKDOWN</Text>
        <View style={styles.card}>
          <CashRow
            icon={
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Rect x={2} y={7} width={20} height={14} rx={3}
                  stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                <Path d="M2 12h20" stroke="#2E7D32" strokeWidth={1.4} fill="none" />
              </Svg>
            }
            label="Buying power"
            sub="Ready to invest now"
            value={fmt(d.buyingPower, d.currency)}
            subRight="What's this?"
            subRightColor="#1D4ED8"
          />
          <View style={styles.rowDivider} />
          <CashRow
            icon={
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={10} stroke="#92400E" strokeWidth={1.8} fill="none" />
                <Path d="M12 7v5l3 3" stroke="#92400E" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
            }
            label="Unsettled cash"
            sub={`Clears in T+2 · ${d.unsettledDate}`}
            value={fmt(d.unsettled, d.currency)}
            valueColor="#92400E"
            subRight="Learn more"
            subRightColor="#1D4ED8"
          />
          <View style={styles.rowDivider} />
          <CashRow
            icon={
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Rect x={3} y={11} width={18} height={11} rx={2}
                  stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4"
                  stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
              </Svg>
            }
            label="Reserved cash"
            sub="Held for pending orders"
            value={fmt(d.reserved, d.currency)}
            valueColor="#1D4ED8"
            subRight={d.reservedOrders > 0 ? `${d.reservedOrders} orders` : '—'}
          />
          <View style={styles.rowDivider} />
          <CashRow
            icon={
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  stroke="#888" strokeWidth={1.8} fill="none" />
              </Svg>
            }
            label="Total account value"
            sub="Cash + portfolio"
            value={fmt(d.totalValue, d.currency)}
          />
        </View>

        {/* ── Withdraw to wallet banner ── */}
        <TouchableOpacity
          style={styles.withdrawBanner}
          onPress={() => router.push('/(protected)/brokerage/withdrawbrokerage' as any)}
          activeOpacity={0.75}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <Circle cx={12} cy={12} r={10} stroke="#1D4ED8" strokeWidth={1.8} fill="none" />
            <Path d="M12 8v4M12 16h.01" stroke="#1D4ED8" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={styles.withdrawBannerTitle}>Withdraw buying power to wallet</Text>
            <Text style={styles.withdrawBannerSub}>
              Transfer funds back to your NGN or USD wallet anytime
            </Text>
          </View>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M9 18l6-6-6-6" stroke="#93C5FD" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>

        {/* ── Portfolio ── */}
        <Text style={styles.secLbl}>
          PORTFOLIO · {exchange === 'US' ? 'US STOCKS & ETFS' : 'NGX STOCKS'}
        </Text>
        <View style={styles.card}>
          {d.holdings.map(h => (
            <HoldingRow
              key={h.ticker}
              holding={h}
              currency={d.currency}
              onPress={() =>
                router.push({
                  pathname: '/market',
                  params: { exchange, ticker: h.ticker },
                } as any)
              }
            />
          ))}
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={() => router.push(`/(protected)/brokerage/holdings?exchange=${exchange}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllTxt}>View all holdings</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M9 18l6-6-6-6" stroke="#1D4ED8" strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Order history ── */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.orderHistRow}
            onPress={() =>
              router.push(`/(protected)//orderhistory?exchange=${exchange}` as any)
            }
            activeOpacity={0.72}
          >
            <View style={styles.orderHistIco}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                  stroke="#888" strokeWidth={1.8} fill="none" />
                <Rect x={9} y={3} width={6} height={4} rx={1}
                  stroke="#888" strokeWidth={1.8} fill="none" />
                <Path d="M9 12h6M9 16h4"
                  stroke="#888" strokeWidth={1.5} strokeLinecap="round" fill="none" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderHistLabel}>Order history</Text>
              <Text style={styles.orderHistSub}>
                {d.orderCount} {exchange} trades · last: {d.orderLastDate}
              </Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M9 18l6-6-6-6" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  topCenter: { flex: 1 },
  topTitle:  { fontSize: 15, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:    { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  histBtn:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  excToggle: {
    flexDirection: 'row', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 18,
    paddingVertical: 10, borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  excBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E8E8E8',
    backgroundColor: '#F5F5F5',
  },
  excBtnActive: {
    backgroundColor: '#fff', borderColor: '#DDDDDD',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  excBtnPrefix:       { fontSize: 9, fontWeight: '700', color: '#AAAAAA' },
  excBtnPrefixActive: { color: '#0F2419' },
  excBtnLabel:        { fontSize: 13, fontWeight: '600', color: '#AAAAAA' },
  excBtnLabelActive:  { color: '#0A0A0A' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  secLbl: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 1.2, marginBottom: 10,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    overflow: 'hidden', marginBottom: 16,
  },

  // Buying power hero
  bpCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    padding: 18, marginBottom: 18, alignItems: 'center',
  },
  bpLabel:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 8 },
  bpAmount: { fontSize: 36, fontWeight: '700', color: '#0A0A0A', letterSpacing: -1, marginBottom: 5 },
  bpSub:    { fontSize: 12, color: '#AAAAAA', marginBottom: 16 },
  bpActions: { flexDirection: 'row', gap: 10, width: '100%' },
  bpFundBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#E8F5E9', borderWidth: 0.5, borderColor: '#A5D6A7',
  },
  bpFundTxt: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  bpWithdrawBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 0.5, borderColor: '#FECACA',
  },
  bpWithdrawTxt: { fontSize: 14, fontWeight: '700', color: '#DC2626' },

  // Cash breakdown
  cashRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, gap: 10,
  },
  cashIco: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cashInfo:     { flex: 1 },
  cashLabel:    { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  cashSub:      { fontSize: 10, color: '#AAAAAA', marginTop: 1 },
  cashRight:    { alignItems: 'flex-end', gap: 2 },
  cashValue:    { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  cashSubRight: { fontSize: 11, fontWeight: '600', color: '#AAAAAA' },
  rowDivider:   { height: 0.5, backgroundColor: '#F5F5F5', marginLeft: 58 },

  // Withdraw banner
  withdrawBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#BFDBFE',
    padding: 12, marginBottom: 16,
  },
  withdrawBannerTitle: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  withdrawBannerSub:   { fontSize: 11, color: '#3B82F6', marginTop: 1 },

  // Holdings
  holdingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5',
  },
  holdingBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F5F5F5', borderWidth: 0.5,
    borderColor: '#E8E8E8',
    alignItems: 'center', justifyContent: 'center',
  },
  holdingTicker: { fontSize: 10, fontWeight: '700', color: '#555' },
  holdingInfo:   { flex: 1 },
  holdingName:   { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  holdingSub:    { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  holdingRight:  { alignItems: 'flex-end', gap: 2 },
  holdingValue:  { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  holdingGain:   { fontSize: 11, fontWeight: '600' },

  viewAllRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 13,
    borderTopWidth: 0.5, borderTopColor: '#F5F5F5',
  },
  viewAllTxt: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },

  // Order history
  orderHistRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 12,
  },
  orderHistIco: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  orderHistLabel: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  orderHistSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
});