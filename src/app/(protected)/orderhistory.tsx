/**
 * OrderHistoryScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Production-grade Order History screen for PulseX.
 * Design inspiration: Moniepoint, Bamboo, Robinhood, Cowrywise.
 *
 * Features:
 *  - Summary cards (total trades + realized P&L)
 *  - Filter sheet (All / Buy / Sell / Filled / Cancelled)
 *  - Monthly grouped order list with animated entry
 *  - Order detail bottom sheet on tap
 *  - Empty state
 *  - Pull to refresh
 *
 * API INTEGRATION:
 *  → fetchOrders(filter) — replace TODO in loadOrders()
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';


const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type Action = 'BUY' | 'SELL';
type Status = 'filled' | 'cancelled' | 'pending';

interface Order {
  id:      string;
  action:  Action;
  ticker:  string;
  name:    string;
  qty:     number;
  price:   number;
  total:   number;
  status:  Status;
  time:    string;
  date:    string; // ISO
  month:   string; // 'JUNE 2025'
  exchange: 'US' | 'NGX';
  currency: '$' | '₦';
  fee:     number;
}

// ─── Mock data — replace with API ────────────────────────────────────────────

const ORDERS: Order[] = [
  { id:'o1',  action:'BUY',  ticker:'NVDA', name:'NVIDIA Corp',        qty:3,  price:872.40, total:2617.20, status:'filled',    time:'09:14', date:'2025-06-10', month:'JUNE 2025',  exchange:'US',  currency:'$', fee:2.50 },
  { id:'o2',  action:'SELL', ticker:'TSLA', name:'Tesla Inc',          qty:2,  price:182.10, total:364.20,  status:'filled',    time:'14:32', date:'2025-06-09', month:'JUNE 2025',  exchange:'US',  currency:'$', fee:1.20 },
  { id:'o3',  action:'BUY',  ticker:'META', name:'Meta Platforms',     qty:1,  price:498.60, total:498.60,  status:'filled',    time:'11:05', date:'2025-06-08', month:'JUNE 2025',  exchange:'US',  currency:'$', fee:0.80 },
  { id:'o4',  action:'BUY',  ticker:'AAPL', name:'Apple Inc',          qty:5,  price:186.20, total:931.00,  status:'cancelled', time:'09:58', date:'2025-06-07', month:'JUNE 2025',  exchange:'US',  currency:'$', fee:0.00 },
  { id:'o5',  action:'BUY',  ticker:'MSFT', name:'Microsoft Corp',     qty:2,  price:415.80, total:831.60,  status:'filled',    time:'15:30', date:'2025-05-30', month:'MAY 2025',   exchange:'US',  currency:'$', fee:1.60 },
  { id:'o6',  action:'SELL', ticker:'NVDA', name:'NVIDIA Corp',        qty:1,  price:820.00, total:820.00,  status:'filled',    time:'10:28', date:'2025-05-28', month:'MAY 2025',   exchange:'US',  currency:'$', fee:0.90 },
  { id:'o7',  action:'BUY',  ticker:'GTCO', name:'GT Holdings',        qty:500,price:48.50,  total:24250,   status:'filled',    time:'12:10', date:'2025-05-22', month:'MAY 2025',   exchange:'NGX', currency:'₦', fee:120  },
  { id:'o8',  action:'BUY',  ticker:'ZENITHBANK',name:'Zenith Bank',   qty:200,price:36.20,  total:7240,    status:'cancelled', time:'09:00', date:'2025-05-20', month:'MAY 2025',   exchange:'NGX', currency:'₦', fee:0.00 },
  { id:'o9',  action:'SELL', ticker:'DANGCEM',name:'Dangote Cement',   qty:100,price:452.00, total:45200,   status:'filled',    time:'14:00', date:'2025-04-18', month:'APRIL 2025', exchange:'NGX', currency:'₦', fee:226  },
  { id:'o10', action:'BUY',  ticker:'AMZN', name:'Amazon Inc',         qty:2,  price:183.90, total:367.80,  status:'pending',   time:'16:45', date:'2025-04-10', month:'APRIL 2025', exchange:'US',  currency:'$', fee:0.00 },
];

type FilterKey = 'All' | 'Buy' | 'Sell' | 'Filled' | 'Cancelled' | 'Pending';
const FILTERS: FilterKey[] = ['All', 'Buy', 'Sell', 'Filled', 'Cancelled', 'Pending'];

function applyFilter(orders: Order[], f: FilterKey): Order[] {
  if (f === 'All')       return orders;
  if (f === 'Buy')       return orders.filter(o => o.action === 'BUY');
  if (f === 'Sell')      return orders.filter(o => o.action === 'SELL');
  if (f === 'Filled')    return orders.filter(o => o.status === 'filled');
  if (f === 'Cancelled') return orders.filter(o => o.status === 'cancelled');
  if (f === 'Pending')   return orders.filter(o => o.status === 'pending');
  return orders;
}

function groupByMonth(orders: Order[]): { month: string; data: Order[] }[] {
  const map: Record<string, Order[]> = {};
  orders.forEach(o => {
    if (!map[o.month]) map[o.month] = [];
    map[o.month].push(o);
  });
  return Object.entries(map).map(([month, data]) => ({ month, data }));
}

function fmt(n: number, cur: '$' | '₦') {
  return `${cur}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  filled:    { label: 'Filled',    color: '#166534', bg: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: '#555',    bg: '#F5F5F5' },
  pending:   { label: 'Pending',   color: '#92400E', bg: '#FEF9EC' },
};

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  index,
  onPress,
}: {
  order: Order;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, delay: index * 45, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 45, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const isBuy = order.action === 'BUY';
  const sc    = STATUS_CONFIG[order.status];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.orderRow} onPress={onPress} activeOpacity={0.72}>

        {/* Action icon */}
        <View style={[styles.orderIcon, { backgroundColor: isBuy ? '#E8F5E9' : '#FEF2F2' }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d={isBuy ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}
              stroke={isBuy ? '#166534' : '#DC2626'}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderTicker}>{order.ticker}</Text>
            <Text style={styles.orderTotal}>{fmt(order.total, order.currency)}</Text>
          </View>
          <View style={styles.orderBottomRow}>
            <View style={styles.orderMetaLeft}>
              <View style={[styles.actionBadge, { backgroundColor: isBuy ? '#E8F5E9' : '#FEF2F2' }]}>
                <Text style={[styles.actionBadgeTxt, { color: isBuy ? '#166534' : '#DC2626' }]}>
                  {order.action}
                </Text>
              </View>
              <Text style={styles.orderMeta}>
                {order.qty} shares · {order.currency}{order.price}
              </Text>
            </View>
            <View style={styles.orderMetaRight}>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusBadgeTxt, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.orderTime}>{order.exchange} · {order.time}</Text>
        </View>

        <Svg width={12} height={12} viewBox="0 0 24 24" style={styles.orderChevron}>
          <Path d="M9 18l6-6-6-6" stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" fill="none" />
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (order) {
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [order]);

  if (!order) return null;

  const isBuy = order.action === 'BUY';
  const sc    = STATUS_CONFIG[order.status];

  const rows = [
    { label: 'Order type',    value: `${order.action === 'BUY' ? 'Market buy' : 'Market sell'}` },
    { label: 'Shares',        value: `${order.qty}` },
    { label: 'Price per share', value: fmt(order.price, order.currency) },
    { label: 'Subtotal',      value: fmt(order.qty * order.price, order.currency) },
    { label: 'Trading fee',   value: order.fee > 0 ? fmt(order.fee, order.currency) : 'Free' },
    { label: 'Exchange',      value: order.exchange },
    { label: 'Date',          value: new Date(order.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) },
    { label: 'Time',          value: order.time },
    { label: 'Order ID',      value: order.id.toUpperCase().padStart(8, '0') },
  ];

  return (
    <Modal visible={!!order} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[detailStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={detailStyles.handle} />

        {/* Header */}
        <View style={detailStyles.header}>
          <View style={[detailStyles.headerIcon, { backgroundColor: isBuy ? '#E8F5E9' : '#FEF2F2' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d={isBuy ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'}
                stroke={isBuy ? '#166534' : '#DC2626'}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
          <View style={detailStyles.headerInfo}>
            <Text style={detailStyles.headerTicker}>{order.action} {order.ticker}</Text>
            <Text style={detailStyles.headerName}>{order.name}</Text>
          </View>
          <View style={[detailStyles.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[detailStyles.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={detailStyles.totalWrap}>
          <Text style={detailStyles.totalLabel}>{isBuy ? 'TOTAL PAID' : 'TOTAL RECEIVED'}</Text>
          <Text style={[detailStyles.totalAmt, { color: isBuy ? '#0A0A0A' : '#166534' }]}>
            {isBuy ? '' : '+'}{fmt(order.total, order.currency)}
          </Text>
        </View>

        {/* Rows */}
        <View style={detailStyles.rowsCard}>
          {rows.map((r, i) => (
            <View key={r.label} style={[detailStyles.detailRow, i < rows.length - 1 && detailStyles.detailRowBorder]}>
              <Text style={detailStyles.detailLabel}>{r.label}</Text>
              <Text style={detailStyles.detailValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={detailStyles.closeBtnTxt}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderRadius: 28,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  handle: { width: 32, height: 3, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 10, marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headerIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  headerTicker: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  headerName:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  statusPill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillTxt:{ fontSize: 11, fontWeight: '700' },
  totalWrap:    { alignItems: 'center', paddingVertical: 16, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#F0F0F0', marginBottom: 16 },
  totalLabel:   { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.2, marginBottom: 6 },
  totalAmt:     { fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  rowsCard:     { backgroundColor: '#FAFAFA', borderRadius: 14, borderWidth: 0.5, borderColor: '#EBEBEB', marginBottom: 16, overflow: 'hidden' },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  detailRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  detailLabel:  { fontSize: 12, color: '#AAAAAA' },
  detailValue:  { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  closeBtn:     { backgroundColor: '#0F2419', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  closeBtnTxt:  { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

function FilterSheet({
  visible,
  active,
  onSelect,
  onClose,
}: {
  visible: boolean;
  active: FilterKey;
  onSelect: (f: FilterKey) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity style={detailStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[filterStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={detailStyles.handle} />
        <Text style={filterStyles.title}>Filter orders</Text>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[filterStyles.filterRow, f === active && filterStyles.filterRowActive]}
            onPress={() => { onSelect(f); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={[filterStyles.filterTxt, f === active && filterStyles.filterTxtActive]}>{f}</Text>
            {f === active && (
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M5 12l5 5L19 7" stroke="#0F2419" strokeWidth={2.2} strokeLinecap="round" fill="none" />
              </Svg>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
}

const filterStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderRadius: 28,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#0A0A0A', marginBottom: 14, letterSpacing: -0.2 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  filterRowActive: { backgroundColor: '#F5F5F5', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 0 },
  filterTxt:       { fontSize: 14, color: '#555' },
  filterTxtActive: { fontWeight: '700', color: '#0F2419' },
});

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ orders }: { orders: Order[] }) {
  const totalTrades = orders.length;
  const pnl = orders
    .filter(o => o.status === 'filled' && o.action === 'SELL')
    .reduce((sum, o) => sum + o.total, 0)
    - orders
    .filter(o => o.status === 'filled' && o.action === 'BUY')
    .reduce((sum, o) => sum + o.total, 0);

  const isUp = pnl >= 0;

  return (
    <View style={summaryStyles.row}>
      <View style={summaryStyles.card}>
        <Text style={summaryStyles.cardLabel}>Total trades</Text>
        <Text style={summaryStyles.cardValue}>{totalTrades}</Text>
      </View>
      <View style={[summaryStyles.card, { borderColor: isUp ? '#A5D6A7' : '#FECACA', backgroundColor: isUp ? '#F0FBF5' : '#FFF5F5' }]}>
        <Text style={summaryStyles.cardLabel}>Realized P&L</Text>
        <Text style={[summaryStyles.cardValue, { color: isUp ? '#166534' : '#DC2626' }]}>
          {isUp ? '+' : ''}{fmt(Math.abs(pnl), '$')}
        </Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  card: {
    flex: 1, backgroundColor: '#FAFAFA',
    borderRadius: 14, borderWidth: 1, borderColor: '#E8E8E8',
    padding: 14,
  },
  cardLabel: { fontSize: 11, color: '#AAAAAA', marginBottom: 6 },
  cardValue: { fontSize: 22, fontWeight: '900', color: '#0A0A0A', letterSpacing: -0.5 },
});

// ─── Month Section Header ─────────────────────────────────────────────────────

function MonthHeader({ month }: { month: string }) {
  return (
    <View style={styles.monthHeader}>
      <Text style={styles.monthHeaderTxt}>{month}</Text>
      <View style={styles.monthLine} />
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterKey }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
          <Rect x={9} y={3} width={6} height={4} rx={1} stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
          <Path d="M9 12h6M9 16h4" stroke="#CCCCCC" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      <Text style={styles.emptyTitle}>No {filter === 'All' ? '' : filter.toLowerCase()} orders</Text>
      <Text style={styles.emptySub}>
        {filter === 'All'
          ? 'Your order history will appear here once you make your first trade.'
          : `No ${filter.toLowerCase()} orders found. Try a different filter.`}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderHistoryScreen() {
  const router = useRouter();

  const [activeFilter,  setActiveFilter]  = useState<FilterKey>('All');
  const [showFilter,    setShowFilter]    = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshing,    setRefreshing]    = useState(false);
  const [orders,        setOrders]        = useState<Order[]>(ORDERS);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, []);

  const loadOrders = useCallback(async () => {
    // ── TODO: replace with your API call ──────────────────────────
    // const data = await fetchOrders(activeFilter);
    // setOrders(data);
    // ─────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 800));
    setOrders(ORDERS);
    setRefreshing(false);
  }, []);

  const filtered = applyFilter(orders, activeFilter);
  const grouped  = groupByMonth(filtered);

  // Flatten for FlatList with section headers
  type ListItem =
    | { type: 'summary' }
    | { type: 'header'; month: string }
    | { type: 'order'; order: Order; indexInGroup: number };

  const listData: ListItem[] = [{ type: 'summary' }];
  grouped.forEach(g => {
    listData.push({ type: 'header', month: g.month });
    g.data.forEach((o, i) => listData.push({ type: 'order', order: o, indexInGroup: i }));
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Order history</Text>
          <Text style={styles.topSub}>
            {activeFilter === 'All' ? 'All transactions' : `Filtered: ${activeFilter}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilter !== 'All' && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.75}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
              stroke={activeFilter !== 'All' ? '#fff' : '#555'}
              strokeWidth={1.8}
              fill="none"
              strokeLinejoin="round"
            />
          </Svg>
          {activeFilter !== 'All' && (
            <View style={styles.filterDot} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Filter chips (horizontal scroll) ── */}
      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipTxt, activeFilter === f && styles.chipTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === 'order' ? item.order.id
          : item.type === 'header' ? `h-${item.month}`
          : 'summary'
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadOrders(); }}
            tintColor="#0F2419"
            colors={['#0F2419']}
          />
        }
        ListEmptyComponent={<EmptyState filter={activeFilter} />}
        renderItem={({ item }) => {
          if (item.type === 'summary') {
            return <SummaryCards orders={filtered} />;
          }
          if (item.type === 'header') {
            return <MonthHeader month={item.month} />;
          }
          if (item.type === 'order') {
            return (
              <View style={styles.orderRowWrap}>
                <OrderRow
                  order={item.order}
                  index={item.indexInGroup}
                  onPress={() => setSelectedOrder(item.order)}
                />
                {item.indexInGroup === 0 && <View style={styles.orderGroupTop} />}
              </View>
            );
          }
          return null;
        }}
      />

      {/* ── Modals ── */}
      <FilterSheet
        visible={showFilter}
        active={activeFilter}
        onSelect={setActiveFilter}
        onClose={() => setShowFilter(false)}
      />
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
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
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  topCenter:  { flex: 1 },
  topTitle:   { fontSize: 15, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:     { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  filterBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: { backgroundColor: '#0F2419' },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#22C55E', borderWidth: 1.5, borderColor: '#0F2419',
  },

  // Chip row
  chipRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE',
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 0.5, borderColor: '#E8E8E8',
  },
  chipActive:    { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  chipTxt:       { fontSize: 11, fontWeight: '600', color: '#666' },
  chipTxtActive: { color: '#fff' },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  monthHeaderTxt: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.2 },
  monthLine: { flex: 1, height: 0.5, backgroundColor: '#E8E8E8' },

  // Order rows grouped visually
  orderRowWrap: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5,
    borderColor: '#EBEBEB', overflow: 'hidden', marginBottom: 10,
  },
  orderGroupTop: {},

  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5',
  },
  orderIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderInfo:    { flex: 1, gap: 4 },
  orderTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTicker:  { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  orderTotal:   { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  orderBottomRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMetaLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderMetaRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  actionBadgeTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  orderMeta:       { fontSize: 10, color: '#AAAAAA' },
  statusBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusBadgeTxt:  { fontSize: 10, fontWeight: '700' },
  orderTime:       { fontSize: 10, color: '#CCCCCC' },
  orderChevron:    { marginLeft: 2, flexShrink: 0 },

  // Empty
  emptyWrap:  { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 12, color: '#AAAAAA', textAlign: 'center', lineHeight: 18 },
});