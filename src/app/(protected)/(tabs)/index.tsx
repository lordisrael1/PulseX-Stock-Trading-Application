import { useColors } from '@/theme/useColor';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Bell,
  ChevronRight,
  Globe,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchGroupedDay,
  fetchMarketStatus,
  type QuoteItem
} from '../../../../api/market.api';


// ─── Home watchlist tickers ────────────────────────────────────────────────────
// These are fetched from the grouped daily summary (1 API call covers all of them)
const US_HOME_TICKERS = ['AAPL'];
const NGX_HOME_TICKERS = ['DANGCEM', 'GTCO', 'ZENITHBANK', 'MTNN', 'AIRTELAFRI'];

// NGX display names not in the shared lib (home-only extras)
const NGX_NAMES: Record<string, string> = {
  DANGCEM: 'Dangote Cement', GTCO: 'GT Holdings',
  ZENITHBANK: 'Zenith Bank', MTNN: 'MTN Nigeria', AIRTELAFRI: 'Airtel Africa',
};
const NGX_SEED: Record<string, number> = {
  DANGCEM: 452, GTCO: 48.5, ZENITHBANK: 36.2, MTNN: 182, AIRTELAFRI: 1410,
};

// ─── Fetch home quotes ────────────────────────────────────────────────────────
// US: real data via Daily Market Summary (one call, filter to our 5 tickers)
// NGX: Massive free tier is US-only → seed gracefully
async function fetchHomeQuotes(
  tickers: string[],
  exchange: 'US' | 'NGX'
): Promise<QuoteItem[]> {
  if (exchange === 'NGX') {
    // Seed NGX — free plan doesn't cover it
    return tickers.map(t => {
      const s = t.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const up = s % 3 !== 0;
      const pct = parseFloat((((s % 480) / 100 + 0.1) * (up ? 1 : -1)).toFixed(2));
      const price = NGX_SEED[t] ?? 100;
      const prev = price / (1 + pct / 100);
      return {
        ticker: t, name: NGX_NAMES[t] ?? t,
        price, open: price * 0.998, high: price * 1.012,
        low: price * 0.985, close: price, prevClose: prev,
        change: parseFloat((price - prev).toFixed(2)),
        changePct: pct,
        volume: 500_000 + (s % 10_000_000),
      };
    });
  }

  // US — reuse fetchGroupedDay from massiveApi (filters to our tickers)
  return fetchGroupedDay(tickers);
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Spark({ positive, w = 60, h = 26 }: { positive: boolean; w?: number; h?: number }) {
  const raw = positive ? [5, 4, 6, 3, 5, 2, 4, 1, 0] : [0, 1, 0, 3, 1, 4, 2, 5, 6];
  const max = Math.max(...raw), min = Math.min(...raw);
  const norm = raw.map(v => 1 - (v - min) / (max - min || 1));
  const step = w / (raw.length - 1);
  const col = positive ? '#00FF87' : '#FF3B30';
  return (
    <View style={{ width: w, height: h }}>
      {norm.slice(0, -1).map((y, i) => {
        const x1 = i * step, y1 = y * h;
        const x2 = (i + 1) * step, y2 = norm[i + 1] * h;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return (
          <View key={i} style={{
            position: 'absolute', left: x1, top: y1 - 1,
            width: len, height: 2, backgroundColor: col,
            transform: [{ rotate: `${angle}deg` }],
          }} />
        );
      })}
    </View>
  );
}

// ─── Quote Row ────────────────────────────────────────────────────────────────

function QuoteRow({
  item, index, exchange, onPress,
}: {
  item: QuoteItem; index: number; exchange: 'US' | 'NGX'; onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 55, useNativeDriver: true }),
      Animated.spring(slideX, { toValue: 0, delay: index * 55, tension: 130, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const up = item.changePct >= 0;
  const col = up ? '#00FF87' : '#FF3B30';
  const cur = exchange === 'NGX' ? '₦' : '$';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.74} style={styles.quoteRow}>
        <View style={[styles.qBadge, { borderColor: col + '28' }]}>
          <Text style={[styles.qTicker, { color: col }]}>{item.ticker.slice(0, 5)}</Text>
        </View>
        <View style={styles.qMeta}>
          <Text style={styles.qName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.qExchange}>{exchange} · {item.volume > 0 ? `VOL ${fmtVol(item.volume)}` : '—'}</Text>
        </View>
        <Spark positive={up} />
        <View style={styles.qPrice}>
          <Text style={styles.qPriceVal}>{cur}{item.price.toFixed(2)}</Text>
          <View style={styles.qChangePill}>
            {up
              ? <ArrowUpRight size={9} color={col} />
              : <ArrowDownRight size={9} color={col} />}
            <Text style={[styles.qChangeTxt, { color: col }]}>
              {Math.abs(item.changePct).toFixed(2)}%
            </Text>
          </View>
        </View>
        <ChevronRight size={11} color="#252525" style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function fmtVol(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

// ─── Market Access Box ────────────────────────────────────────────────────────

function MarketBox({
  type, marketStatus, onPress,
}: {
  type: 'US' | 'NGX'; marketStatus: string | null; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isUS = type === 'US';

  // Subtle pulse on the live dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const dotOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.94, tension: 280, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  // Status label — only meaningful for US (NGX not on API)
  const statusLabel = isUS
    ? (marketStatus === 'open' ? 'OPEN' : marketStatus === 'extended-hours' ? 'EXT' : 'CLOSED')
    : 'NGX';
  const statusColor = isUS
    ? (marketStatus === 'open' ? '#00FF87' : marketStatus === 'extended-hours' ? '#FFD60A' : '#FF3B30')
    : '#00FF87';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ flex: 1 }}>
      <Animated.View style={[
        styles.marketBox,
        isUS ? styles.marketBoxUS : styles.marketBoxNGX,
        { transform: [{ scale: scaleAnim }] },
      ]}>
        {/* Glow blob */}
        <View style={[styles.marketGlow, { backgroundColor: isUS ? '#0A84FF16' : '#00FF8710' }]} />

        <View style={styles.marketTopRow}>
          <View style={[styles.marketIconWrap, {
            backgroundColor: isUS ? '#0A84FF14' : '#00FF8712',
            borderColor: isUS ? '#0A84FF2E' : '#00FF8728',
          }]}>
            {isUS ? <Globe size={15} color="#0A84FF" /> : <BarChart2 size={15} color="#00FF87" />}
          </View>

          {/* Live / status tag */}
          <View style={[styles.statusTag, { borderColor: statusColor + '30', backgroundColor: statusColor + '0E' }]}>
            <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, opacity: dotOpacity }]} />
            <Text style={[styles.statusTagTxt, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={[styles.marketTitle, { color: isUS ? '#0A84FF' : '#00FF87' }]}>
          {isUS ? 'US STOCKS' : 'NGX STOCKS'}
        </Text>
        <Text style={styles.marketSub}>{isUS ? 'NYSE · NASDAQ' : 'Nigerian Exchange'}</Text>

        <View style={styles.marketFooter}>
          <Text style={styles.marketCount}>{isUS ? '8,000+' : '120+'} tickers</Text>
          <ChevronRight size={14} color="#3A3A3A" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({ usQuotes }: { usQuotes: QuoteItem[] }) {
  const router = useRouter();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.10] });

  // Derive a "live" total change from real quotes if available
  const totalChangePct = usQuotes.length
    ? (usQuotes.reduce((a, q) => a + q.changePct, 0) / usQuotes.length).toFixed(2)
    : '8.21';
  const isUp = parseFloat(totalChangePct) >= 0;

  return (
    <View style={styles.balanceCard}>
      <Animated.View style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]} />

      <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceValue}>$44,678</Text>
        <Text style={styles.balanceCents}>.32</Text>
        <View style={[styles.gainTag, { borderColor: (isUp ? '#00FF87' : '#FF3B30') + '30', backgroundColor: (isUp ? '#00FF87' : '#FF3B30') + '12' }]}>
          {isUp ? <TrendingUp size={9} color={isUp ? '#00FF87' : '#FF3B30'} /> : <TrendingDown size={9} color="#FF3B30" />}
          <Text style={[styles.gainTagText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
            {isUp ? '+' : ''}{totalChangePct}%
          </Text>
        </View>
      </View>
      <Text style={[styles.balanceSub, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
        {isUp ? '+' : '-'}$3,614.08 today
      </Text>

      <View style={styles.allocRow}>
        {[
          { label: 'NVDA', pct: '42%', color: '#00FF87' },
          { label: 'AAPL', pct: '28%', color: '#0A84FF' },
          { label: 'OTHER', pct: '30%', color: '#FFD60A' },
        ].map(a => (
          <View key={a.label} style={styles.allocPill}>
            <View style={[styles.allocDot, { backgroundColor: a.color }]} />
            <Text style={styles.allocText}>{a.label} {a.pct}</Text>
          </View>
        ))}
      </View>

      <View style={styles.allocBarTrack}>
        {[
          { flex: 42, color: '#00FF87' },
          { flex: 28, color: '#0A84FF' },
          { flex: 30, color: '#FFD60A' },
        ].map((s, i) => (
          <View key={i} style={[styles.allocBarSeg, {
            flex: s.flex, backgroundColor: s.color,
            borderRadius: i === 0 ? 4 : i === 2 ? 4 : 0,
          }]} />
        ))}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/payment/deposit')} activeOpacity={0.75}>
          <View style={styles.actionIconWrap}>
            <ArrowDownLeft size={16} color="#00FF87" strokeWidth={2} />
          </View>
          <Text style={styles.actionLabel}>DEPOSIT</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/payment/withdraw')} activeOpacity={0.75}>
          <View style={[styles.actionIconWrap, styles.actionIconWithdraw]}>
            <ArrowUpRight size={16} color="#FF3B30" strokeWidth={2} />
          </View>
          <Text style={[styles.actionLabel, { color: '#FF3B30' }]}>WITHDRAW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.25, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[styles.skeletonRow, { opacity: pulse }]}>
      <View style={styles.skeletonBadge} />
      <View style={styles.skeletonMeta}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: 55, marginTop: 4 }]} />
      </View>
      <View style={styles.skeletonPrice} />
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const c = useColors();
  const [usQuotes, setUsQuotes] = useState<QuoteItem[]>([]);
  const [ngxQuotes, setNgxQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      // Use Promise.race to enforce a maximum timeout of 12 seconds for the entire load operation
      const loadPromise = Promise.all([
        fetchHomeQuotes(US_HOME_TICKERS, 'US'),
        fetchHomeQuotes(NGX_HOME_TICKERS, 'NGX'),
        fetchMarketStatus(),
      ]);

      // Create a timeout promise that rejects after 12 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Data loading timeout - using fallback data')), 12000)
      );

      const [us, ngx, status] = await Promise.race([loadPromise, timeoutPromise]) as [
        QuoteItem[],
        QuoteItem[],
        { market: string } | null
      ];

      setUsQuotes(us);
      setNgxQuotes(ngx);
      if (status) setMarketStatus(status.market);
    } catch (error) {
      console.error('[HomeScreen] Error loading data:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load market data');
      // Silently continue with whatever data we have (seeded/cached)
      // Don't throw - let UI show partial/fallback data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 460, useNativeDriver: true }).start();
    load();
  }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <SafeAreaView style= {styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor="#00FF87" colors={['#00FF87']}
          />
        }
      >
        {/* ── Top Bar ── */}
        <Animated.View style={[styles.topBar, { opacity: headerAnim }]}>
          <View>
            <Text style={styles.greeting}>Hi, Israel!</Text>
            <View style={styles.greetingSub}>
              <Activity size={10} color="#00FF87" />
              <Text style={styles.greetingSubText}>
                {marketStatus === 'open'
                  ? 'Markets open · NYSE/NASDAQ'
                  : marketStatus === 'extended-hours'
                    ? 'Extended hours · NYSE/NASDAQ'
                    : 'Markets closed · NYSE/NASDAQ'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={styles.bellBtn}>
              <Bell size={17} color="#777" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellBtn}>
              <View>
                <Text style={[styles.gainTagText, { color: '#253237' }]}>JI</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Balance Card ── */}
        <BalanceCard usQuotes={usQuotes} />

        {/* ── Market Access Boxes ── */}
        <View style={styles.sectionRow}>
          <Zap size={11} color="#3A3A3A" />
          <Text style={styles.sectionLabel}>MARKETS</Text>
        </View>

        <View style={styles.marketBoxRow}>
          <MarketBox
            type="US"
            marketStatus={marketStatus}
            onPress={() => router.push({ pathname: '/market', params: { exchange: 'US' } })}
          />
          <MarketBox
            type="NGX"
            marketStatus={null}
            onPress={() => router.push({ pathname: '/market', params: { exchange: 'NGX' } })}
          />
        </View>

        {/* ── US Watchlist ── */}
        <View style={[styles.sectionRow, { marginTop: 26 }]}>
          <Globe size={11} color="#0A84FF" />
          <Text style={[styles.sectionLabel, { color: '#0A84FF' }]}>US WATCHLIST</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/market', params: { exchange: 'US' } })}
            style={styles.viewAll}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <ChevronRight size={10} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          {loading
            ? US_HOME_TICKERS.map((_, i) => <SkeletonRow key={i} />)
            : usQuotes.map((q, i) => (
              <QuoteRow
                key={q.ticker} item={q} index={i} exchange="US"
                onPress={() =>
                  router.push({ pathname: '/market', params: { exchange: 'US', ticker: q.ticker } })
                }
              />
            ))}
        </View>

        {/* ── NGX Watchlist ── */}
        <View style={[styles.sectionRow, { marginTop: 26 }]}>
          <BarChart2 size={11} color="#00FF87" />
          <Text style={[styles.sectionLabel, { color: '#00FF87' }]}>NGX WATCHLIST</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/market', params: { exchange: 'NGX' } })}
            style={styles.viewAll}
          >
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <ChevronRight size={10} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          {loading
            ? NGX_HOME_TICKERS.map((_, i) => <SkeletonRow key={i} />)
            : ngxQuotes.map((q, i) => (
              <QuoteRow
                key={q.ticker} item={q} index={i} exchange="NGX"
                onPress={() =>
                  router.push({ pathname: '/market', params: { exchange: 'NGX', ticker: q.ticker } })
                }
              />
            ))}
        </View>

        {/* ── NGX disclaimer ── */}
        <View style={styles.disclaimer}>
          <Activity size={9} color="#2A2A2A" />
          <Text style={styles.disclaimerTxt}>
            US data via Massive Finance API · NGX data is indicative only
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 18 },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 16, paddingBottom: 22,
  },
  greeting: {
    color: '#253357', fontSize: 22, fontWeight: '800',
    fontFamily: 'Courier', letterSpacing: -0.5,
  },
  greetingSub: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  greetingSubText: { color: '#383838', fontSize: 10, fontFamily: 'Courier' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#E8E8E8', borderWidth: 1, borderColor: '#D0D0D0',
    justifyContent: 'center', alignItems: 'center',
  },
  bellDot: {
    position: 'absolute', top: 9, right: 9,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#050505',
  },

  // Balance card
  balanceCard: {
    backgroundColor: '#FBFEFB', borderRadius: 18, borderWidth: 0.2,
    borderColor: '#181818', padding: 20, marginBottom: 26, overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00FF87',
  },
  balanceLabel: {
    color: '#383838', fontSize: 9, letterSpacing: 3,
    fontFamily: 'Courier', marginBottom: 8,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  balanceValue: {
    color: '#253357', fontSize: 36, fontWeight: '800',
    fontFamily: 'Courier', letterSpacing: -1,
  },
  balanceCents: {
    color: '#777', fontSize: 19, fontWeight: '600',
    fontFamily: 'Courier', marginBottom: 6,
  },
  gainTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, marginBottom: 4, marginLeft: 6,
  },
  gainTagText: { fontSize: 16, fontWeight: '700', fontFamily: 'Courier' },
  balanceSub: { fontSize: 11, fontFamily: 'Courier', marginTop: 4, marginBottom: 16 },
  allocRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  allocPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  allocDot: { width: 6, height: 6, borderRadius: 3 },
  allocText: { color: '#484848', fontSize: 9, fontFamily: 'Courier' },
  allocBarTrack: {
    flexDirection: 'row', height: 4, borderRadius: 4, overflow: 'hidden', gap: 1,
  },
  allocBarSeg: { height: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#00FF8712',
      borderWidth: 1,
      borderColor: '#DDEEEA',
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#00FF8712',
    borderWidth: 1,
    borderColor: '#00FF8730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWithdraw: {
    backgroundColor: '#FF3B3012',
    borderColor: '#FF3B3030',
  },
  actionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',  // swap for your mono font
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#00FF87',
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Section header
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel: {
    color: '#383838', fontSize: 10, letterSpacing: 2,
    fontFamily: 'Courier', flex: 1,
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAllText: { color: '#2A2A2A', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },

  // Market boxes
  marketBoxRow: { flexDirection: 'row', gap: 10 },
  marketBox: {
    borderRadius: 16, borderWidth: 1, padding: 15,
    overflow: 'hidden', minHeight: 118, justifyContent: 'space-between',
  },
  marketBoxUS: { backgroundColor: '#FBFEFB', borderColor: '#0A84FF22' },
  marketBoxNGX: { backgroundColor: '#FBFEFB', borderColor: '#00FF8722' },
  marketGlow: {
    position: 'absolute', width: 80, height: 80,
    borderRadius: 40, top: -20, right: -20,
  },
  marketTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marketIconWrap: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusTagTxt: { fontSize: 8, fontFamily: 'Courier', fontWeight: '800', letterSpacing: 0.8 },
  marketTitle: { fontSize: 14, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 0.5, marginTop: 10 },
  marketSub: { color: '#383838', fontSize: 9, fontFamily: 'Courier', marginTop: 2 },
  marketFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  marketCount: { color: '#2E2E2E', fontSize: 9, fontFamily: 'Courier' },

  // Quote list
  listCard: {
    backgroundColor: '#FBFEFB', borderRadius: 14,
    borderWidth: 0.1, borderColor: '#141414', overflow: 'hidden',
  },
  quoteRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 0.4, borderBottomColor: '#101010', gap: 10,
  },
  qBadge: {
    width: 52, height: 30, borderRadius: 6, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBFEFB',
  },
  qTicker: { fontSize: 9, fontWeight: '900', fontFamily: 'Courier', letterSpacing: 0.4 },
  qMeta: { flex: 1, gap: 2 },
  qName: { color: '#B8B8B8', fontSize: 11, fontWeight: '600', fontFamily: 'Courier' },
  qExchange: { color: '#2E2E2E', fontSize: 9, fontFamily: 'Courier' },
  qPrice: { alignItems: 'flex-end', gap: 2 },
  qPriceVal: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  qChangePill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  qChangeTxt: { fontSize: 10, fontWeight: '700', fontFamily: 'Courier' },

  // Skeleton
  skeletonRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 0.6, borderBottomColor: '#101010', gap: 10,
  },
  skeletonBadge: { width: 52, height: 30, borderRadius: 6, backgroundColor: '#181818' },
  skeletonMeta: { flex: 1 },
  skeletonLine: { height: 10, borderRadius: 5, backgroundColor: '#181818', width: '68%' },
  skeletonPrice: { width: 58, height: 28, borderRadius: 6, backgroundColor: '#181818' },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 14, justifyContent: 'center',
  },
  disclaimerTxt: { color: '#1E1E1E', fontSize: 9, fontFamily: 'Courier' },
});