import { useColors } from '@/theme/useColor';
import {
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  TrendingDown,
  TrendingUp
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');


// ─── Mock Data ────────────────────────────────────────────────────────────────

const HOLDINGS = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', shares: 12, avg: 412.5, current: 891.2, change: 5.14 },
  { ticker: 'TSLA', name: 'Tesla Inc', shares: 8, avg: 220.0, current: 178.4, change: -2.87 },
  { ticker: 'AAPL', name: 'Apple Inc', shares: 25, avg: 155.3, current: 189.5, change: 0.43 },
  { ticker: 'MSFT', name: 'Microsoft', shares: 5, avg: 310.0, current: 415.8, change: 1.22 },
  { ticker: 'AMZN', name: 'Amazon', shares: 10, avg: 128.0, current: 183.9, change: -0.65 },
  { ticker: 'META', name: 'Meta Platforms', shares: 7, avg: 290.0, current: 512.3, change: 3.78 },
];

const TOTAL_VALUE = HOLDINGS.reduce((s, h) => s + h.current * h.shares, 0);
const TOTAL_COST = HOLDINGS.reduce((s, h) => s + h.avg * h.shares, 0);
const TOTAL_GAIN = TOTAL_VALUE - TOTAL_COST;
const TOTAL_GAIN_PCT = (TOTAL_GAIN / TOTAL_COST) * 100;

// ─── Allocation Bar ────────────────────────────────────────────────────────────

const BAR_COLORS = ['#00FF87', '#FF3B30', '#0A84FF', '#FFD60A', '#FF9F0A', '#BF5AF2'];

function AllocationBar() {
  const segments = HOLDINGS.map((h, i) => ({
    pct: (h.current * h.shares) / TOTAL_VALUE,
    color: BAR_COLORS[i],
    ticker: h.ticker,
  }));

  return (
    <View style={styles.allocBar}>
      {segments.map((seg, i) => (
        <View
          key={seg.ticker}
          style={[
            styles.allocSegment,
            {
              flex: seg.pct,
              backgroundColor: seg.color,
              borderRadius: i === 0 ? 3 : i === segments.length - 1 ? 3 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Mini Sparkline (SVG-less, pure RN) ────────────────────────────────────────

function Sparkline({ positive }: { positive: boolean }) {
  const points = positive
    ? [10, 8, 12, 7, 11, 6, 9, 4, 2, 1]
    : [1, 3, 2, 5, 4, 7, 5, 8, 9, 10];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = points.map((p) => 1 - (p - min) / (max - min));
  const H = 24;
  const W = 48;
  const step = W / (points.length - 1);

  return (
    <View style={{ width: W, height: H }}>
      {norm.slice(0, -1).map((y, i) => {
        const x1 = i * step;
        const y1 = y * H;
        const x2 = (i + 1) * step;
        const y2 = norm[i + 1] * H;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1 - 1,
              width: len,
              height: 1.5,
              backgroundColor: positive ? '#00FF87' : '#FF3B30',
              transform: [{ rotate: `${angle}deg` }, { translateX: 0 }],
              transformOrigin: '0 50%',
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Holding Row ──────────────────────────────────────────────────────────────

function HoldingRow({ item, index }: { item: (typeof HOLDINGS)[0]; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const isUp = item.change >= 0;
  const gainAmt = (item.current - item.avg) * item.shares;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 60,
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.holdingRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Ticker Badge */}
      <View style={[styles.tickerBadge, { borderColor: isUp ? '#00FF8730' : '#FF3B3030' }]}>
        <Text style={[styles.tickerText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
          {item.ticker}
        </Text>
      </View>

      {/* Name + Shares */}
      <View style={styles.holdingMeta}>
        <Text style={styles.holdingName}>{item.name}</Text>
        <Text style={styles.holdingShares}>{item.shares} shares · avg ${item.avg.toFixed(2)}</Text>
      </View>

      {/* Sparkline */}
      <Sparkline positive={isUp} />

      {/* Price + Change */}
      <View style={styles.holdingPriceCol}>
        <Text style={styles.holdingCurrentPrice}>${item.current.toFixed(2)}</Text>
        <View style={styles.changePill}>
          {isUp ? (
            <ArrowUpRight size={10} color="#00FF87" />
          ) : (
            <ArrowDownRight size={10} color="#FF3B30" />
          )}
          <Text style={[styles.changeText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
            {Math.abs(item.change).toFixed(2)}%
          </Text>
        </View>
        <Text style={[styles.gainAmt, { color: gainAmt >= 0 ? '#00FF87' : '#FF3B30' }]}>
          {gainAmt >= 0 ? '+' : ''}${gainAmt.toFixed(0)}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [activeFilter, setActiveFilter] = useState('All');
  const FILTERS = ['All', 'Gainers', 'Losers', 'Watchlist'];
  const c = useColors();

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const isUp = TOTAL_GAIN >= 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.screenLabel}>PORTFOLIO</Text>
              <Text style={styles.totalValue}>
                ${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.overallBadge}>
              {isUp ? (
                <TrendingUp size={14} color="#00FF87" />
              ) : (
                <TrendingDown size={14} color="#FF3B30" />
              )}
              <Text style={[styles.overallPct, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
                {isUp ? '+' : ''}
                {TOTAL_GAIN_PCT.toFixed(2)}%
              </Text>
            </View>
          </View>

          <Text style={[styles.totalGainLine, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
            {isUp ? '+' : ''}${TOTAL_GAIN.toLocaleString('en-US', { minimumFractionDigits: 2 })} all time
          </Text>
        </Animated.View>

        {/* ── Allocation Bar ── */}
        <View style={styles.allocSection}>
          <View style={styles.sectionHeaderRow}>
            <Layers size={12} color="#555" />
            <Text style={styles.sectionLabel}>ALLOCATION</Text>
          </View>
          <AllocationBar />
          <View style={styles.allocLegend}>
            {HOLDINGS.map((h, i) => (
              <View key={h.ticker} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: BAR_COLORS[i] }]} />
                <Text style={styles.legendText}>{h.ticker}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Holdings List ── */}
        <View style={styles.holdingsList}>
          {HOLDINGS.filter((h) => {
            if (activeFilter === 'Gainers') return h.change >= 0;
            if (activeFilter === 'Losers') return h.change < 0;
            return true;
          }).map((item, i) => (
            <HoldingRow key={item.ticker} item={item} index={i} />
          ))}
        </View>

        {/* ── Bottom Pad ── */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // use a fixed background color to avoid referencing theme hook outside component
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { paddingTop: 20, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  screenLabel: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  totalValue: {
    color: '#253357',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    fontFamily: 'Courier',
  },
  overallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  overallPct: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier' },
  totalGainLine: { fontSize: 13, fontFamily: 'Courier', marginTop: 4 },

  allocSection: { marginTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },
  allocBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 1,
  },
  allocSegment: { height: 6 },
  allocLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: '#555', fontSize: 10, fontFamily: 'Courier' },

  divider: { height: 1, backgroundColor: '#141414', marginVertical: 20 },

  filterRow: { gap: 8, paddingBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#141414',
    backgroundColor: '#FBFEFB',
  },
  filterChipActive: { backgroundColor: '#1A1A1A', borderColor: '#333' },
  filterText: { color: '#444', fontSize: 11, fontFamily: 'Courier', letterSpacing: 1 },
  filterTextActive: { color: '#F5F5F5' },

  holdingsList: { gap: 2 },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FBFEFB',
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#141414',
    gap: 10,
  },
  tickerBadge: {
    width: 52,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  tickerText: { fontSize: 11, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 0.5 },
  holdingMeta: { flex: 1, gap: 2 },
  holdingName: { color: '#253357', fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
  holdingShares: { color: '#444', fontSize: 11, fontFamily: 'Courier' },
  holdingPriceCol: { alignItems: 'flex-end', gap: 2 },
  holdingCurrentPrice: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Courier' },
  gainAmt: { fontSize: 10, fontFamily: 'Courier' },
});