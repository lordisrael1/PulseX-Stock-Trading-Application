import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop, Circle as SvgCircle } from 'react-native-svg';
import {
  type MarketStatus,
  type NewsItem,
  type OHLCBar,
  type QuoteItem,
  deriveBreadth,
  // FIX B: imported from market.api — no local re-declarations
  deriveMovers,
  fetchGroupedDay,
  fetchMarketStatus,
  fetchNews,
  fetchOHLC,
  fmtBig,
  seedCandles,
  seedQuote
} from '../../../../api/market.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Exchange = 'US' | 'NGX';
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

interface SectorData { label: string; pct: number; up: boolean }
interface BreadthData { adv: number; unc: number; dec: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - 64;
const CHART_H = 110;

const US_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'META', 'AMZN', 'MSFT', 'GOOGL', 'AVGO', 'JPM', 'V'];
const NGX_TICKERS = ['GTCO', 'ZENITHBANK', 'DANGCEM', 'MTNN', 'ACCESSCORP', 'UBA', 'FBNH', 'SEPLAT', 'BUAFOODS', 'AIRTELAFRI'];

// Proxy ticker for the index chart (SPY for US, DANGCEM as NGX proxy)
const INDEX_PROXY: Record<Exchange, string> = { US: 'SPY', NGX: 'DANGCEM' };

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y'];

// Mock sector data — Massive free tier has no sector endpoint.
// Replace with your own sector aggregation if available.
const SECTOR_DATA: Record<Exchange, SectorData[]> = {
  US: [
    { label: 'TECH', pct: 2.4, up: true },
    { label: 'HLTH', pct: -0.8, up: false },
    { label: 'FINC', pct: 1.1, up: true },
    { label: 'ENRG', pct: -1.9, up: false },
    { label: 'CONS', pct: 0.3, up: true },
    { label: 'UTIL', pct: -0.4, up: false },
  ],
  NGX: [
    { label: 'BANK', pct: 3.1, up: true },
    { label: 'INDS', pct: -0.5, up: false },
    { label: 'CONS', pct: 0.8, up: true },
    { label: 'OIL', pct: 1.4, up: true },
    { label: 'TECH', pct: -0.2, up: false },
    { label: 'UTIL', pct: 0.6, up: true },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ohlcToClose(bars: OHLCBar[]): number[] {
  return bars.map(b => b.c);
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 6;
  const W = CHART_W;
  const H = CHART_H;

  const xp = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const yp = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);

  let d = `M ${xp(0)} ${yp(points[0])}`;
  for (let i = 1; i < points.length; i++) d += ` L ${xp(i)} ${yp(points[i])}`;

  const lastX = xp(points.length - 1);
  const lastY = yp(points[points.length - 1]);
  const area = `${d} L ${lastX} ${H} L ${xp(0)} ${H} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1D9E75" stopOpacity={0.2} />
          <Stop offset="1" stopColor="#1D9E75" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#cg)" />
      <Path d={d} stroke="#1D9E75" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <SvgCircle cx={lastX} cy={lastY} r={4} fill="#1D9E75" />
    </Svg>
  );
}

// ─── Mover Card ───────────────────────────────────────────────────────────────

function MoverCard({ item, onPress }: { item: QuoteItem; onPress: () => void }) {
  const up = item.changePct >= 0;
  return (
    <TouchableOpacity
      style={[styles.moverCard, up ? styles.moverCardGreen : styles.moverCardRed]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.moverTop}>
        <Text style={[styles.moverTicker, { color: up ? '#1D9E75' : '#E24B4A' }]}>
          {item.ticker}
        </Text>
        <Text style={{ fontSize: 13, color: up ? '#1D9E75' : '#E24B4A' }}>
          {up ? '▲' : '▼'}
        </Text>
      </View>
      <Text style={styles.moverName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.moverPrice}>
        {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
      <Text style={[styles.moverPct, { color: up ? '#1D9E75' : '#E24B4A' }]}>
        {up ? '+' : ''}{item.changePct.toFixed(2)}%
      </Text>
      <Text style={styles.moverVol}>VOL {fmtBig(item.volume, '')}</Text>
    </TouchableOpacity>
  );
}

// ─── Sector Tile ──────────────────────────────────────────────────────────────

function SectorTile({ item }: { item: SectorData }) {
  return (
    <View style={[styles.sectorTile, { backgroundColor: item.up ? '#E8F5E9' : '#FEF2F2' }]}>
      <Text style={[styles.sectorLabel, { color: item.up ? '#1A5C2A' : '#991B1B' }]}>
        {item.label}
      </Text>
      <Text style={[styles.sectorPct, { color: item.up ? '#1D9E75' : '#E24B4A' }]}>
        {item.up ? '+' : ''}{Math.abs(item.pct).toFixed(1)}%
      </Text>
    </View>
  );
}

// ─── News Row ─────────────────────────────────────────────────────────────────

function NewsRow({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  const date = new Date(item.published_utc);
  const ago = Math.round((Date.now() - date.getTime()) / 60000);
  const label = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
  return (
    <TouchableOpacity style={styles.newsRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.newsInfo}>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsMeta}>{item.publisher.name} · {label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Breadth Bar ─────────────────────────────────────────────────────────────

function BreadthBar({ adv, unc, dec }: BreadthData) {
  const total = adv + unc + dec || 1;
  return (
    <View style={styles.breadthBarWrap}>
      <View style={[styles.breadthSeg, { flex: adv / total, backgroundColor: '#1D9E75', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
      <View style={[styles.breadthSeg, { flex: unc / total, backgroundColor: '#D3D1C7' }]} />
      <View style={[styles.breadthSeg, { flex: dec / total, backgroundColor: '#E24B4A', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const router = useRouter();

  const [exchange, setExchange] = useState<Exchange>('US');
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartPts, setChartPts] = useState<number[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [marketStat, setMarketStat] = useState<MarketStatus | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Load all data for current exchange + range ────────────────────
  const loadData = useCallback(async (exc: Exchange, range: TimeRange) => {
    const tickers = exc === 'US' ? US_TICKERS : NGX_TICKERS;

    // Run in parallel — chart + quotes + status + news
    const [ohlcBars, quotesRaw, status, newsItems] = await Promise.allSettled([
      // TODO: swap fetchOHLC for a portfolio chart endpoint if you have one
      fetchOHLC(INDEX_PROXY[exc], range),
      // TODO: for NGX, wire in your own exchange data source
      fetchGroupedDay(tickers),
      fetchMarketStatus(),
      fetchNews(INDEX_PROXY[exc], 4),
    ]);

    if (!mounted.current) return;

    if (ohlcBars.status === 'fulfilled') {
      setChartPts(ohlcToClose(ohlcBars.value));
    } else {
      setChartPts(ohlcToClose(seedCandles(INDEX_PROXY[exc], 30)));
    }

    if (quotesRaw.status === 'fulfilled') {
      setQuotes(quotesRaw.value);
    } else {
      setQuotes(tickers.map(seedQuote));
    }

    if (status.status === 'fulfilled' && status.value) {
      setMarketStat(status.value);
    }

    // FIX C: removed stale-closure guard `if (news.length === 0 && ...)`.
    // That check always read the initial closure value (0) and prevented news
    // from ever refreshing on pull-to-refresh. Always set on fulfilled.
    if (newsItems.status === 'fulfilled') {
      setNews(newsItems.value);
    }
  }, []); // no deps — loadData is pure aside from setters and mounted ref

  useEffect(() => {
    setLoading(true);
    loadData(exchange, timeRange).finally(() => {
      if (mounted.current) setLoading(false);
    });
  }, [exchange, timeRange, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(exchange, timeRange);
    setRefreshing(false);
  }, [exchange, timeRange, loadData]);

  // ── Derived values ───────────────────────────────────────────────
  // FIX B: deriveMovers / deriveBreadth now come from market.api import above.
  // The duplicate local definitions that were here have been removed.
  const { gainers, losers } = deriveMovers(quotes, 2);
  const topMovers = [...gainers, ...losers];
  const breadth = deriveBreadth(quotes);

  const marketOpen = marketStat?.market === 'open';
  const totalChange = quotes.length
    ? (quotes.reduce((sum, q) => sum + q.changePct, 0) / quotes.length).toFixed(2)
    : '0.00';
  const changeUp = parseFloat(totalChange) >= 0;

  const sectors = SECTOR_DATA[exchange];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0F2419"
            colors={['#0F2419']}
          />
        }
      >

        {/* ── Top header ── */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerLblRow}>
              <Text style={styles.headerLbl}>ANALYTICS</Text>
              <View style={[styles.marketBadge, { backgroundColor: marketOpen ? '#E8F5E9' : '#FEF2F2' }]}>
                <View style={[styles.marketDot, { backgroundColor: marketOpen ? '#1D9E75' : '#E24B4A' }]} />
                <Text style={[styles.marketBadgeTxt, { color: marketOpen ? '#1A5C2A' : '#991B1B' }]}>
                  {marketOpen ? 'LIVE' : 'CLOSED'}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSub}>
              Market Overview · {exchange === 'US' ? 'NYSE/NASDAQ' : 'Nigerian Exchange'}
            </Text>
          </View>
          <View style={styles.excToggle}>
            {(['US', 'NGX'] as Exchange[]).map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.excBtn, exchange === e && styles.excBtnActive]}
                onPress={() => setExchange(e)}
                activeOpacity={0.75}
              >
                <Text style={[styles.excBtnTxt, exchange === e && styles.excBtnTxtActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Chart card ── */}
        <View style={styles.chartCard}>
          {loading ? (
            <View style={[styles.chartWrap, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator color="#0F2419" />
            </View>
          ) : (
            <>
              <View style={styles.chartMeta}>
                <View>
                  <Text style={styles.chartValueLbl}>
                    {exchange === 'US' ? 'SPY (proxy)' : 'DANGCEM (proxy)'}
                  </Text>
                  <Text style={[styles.chartChange, { color: changeUp ? '#1D9E75' : '#E24B4A' }]}>
                    {changeUp ? '▲' : '▼'} {changeUp ? '+' : ''}{totalChange}% avg ({timeRange})
                  </Text>
                </View>
                <View style={styles.chartRange}>
                  {chartPts.length > 0 && (
                    <>
                      <Text style={styles.chartHiLo}>
                        H {Math.max(...chartPts).toFixed(2)}
                      </Text>
                      <Text style={[styles.chartHiLo, { marginTop: 3 }]}>
                        L {Math.min(...chartPts).toFixed(2)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.chartWrap}>
                {chartPts.length > 1 && <Sparkline points={chartPts} />}
              </View>
            </>
          )}

          <View style={styles.rangeRow}>
            {TIME_RANGES.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeTab, timeRange === r && styles.rangeTabActive]}
                onPress={() => setTimeRange(r)}
                activeOpacity={0.75}
              >
                <Text style={[styles.rangeTabTxt, timeRange === r && styles.rangeTabTxtActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Top movers ── */}
        <Text style={styles.sectionLbl}>TOP MOVERS</Text>
        {loading ? (
          <View style={styles.loadingRow}><ActivityIndicator color="#0F2419" /></View>
        ) : (
          <View style={styles.moversGrid}>
            {topMovers.map(m => (
              <MoverCard
                key={m.ticker}
                item={m}
                onPress={() =>
                  router.push({
                    pathname: '/(protected)/market',
                    params: { ticker: m.ticker, exchange: exchange as string },
                  } as any)
                }
              />
            ))}
          </View>
        )}

        {/* ── Sector heat ── */}
        <Text style={styles.sectionLbl}>SECTOR HEAT</Text>
        <View style={styles.sectorsGrid}>
          {sectors.map(s => <SectorTile key={s.label} item={s} />)}
        </View>

        {/* ── Market breadth ── */}
        <Text style={styles.sectionLbl}>MARKET BREADTH</Text>
        <View style={styles.breadthCard}>
          <View style={styles.breadthLabels}>
            <Text style={styles.advLbl}>▲ {breadth.adv} Advancing</Text>
            <Text style={styles.uncLbl}>{breadth.unc} Unchanged</Text>
            <Text style={styles.decLbl}>▼ {breadth.dec} Declining</Text>
          </View>
          <BreadthBar adv={breadth.adv} unc={breadth.unc} dec={breadth.dec} />
          <View style={styles.statsRow}>
            {[
              { label: 'Tracked', val: String(quotes.length) },
              { label: 'Avg chg', val: `${changeUp ? '+' : ''}${totalChange}%`, color: changeUp ? '#1D9E75' : '#E24B4A' },
              { label: 'Gainers', val: String(breadth.adv), color: '#1D9E75' },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={[styles.statVal, s.color ? { color: s.color } : null]}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── News feed ── */}
        {news.length > 0 && (
          <>
            <Text style={styles.sectionLbl}>MARKET NEWS</Text>
            <View style={styles.newsCard}>
              {news.map(n => (
                <NewsRow
                  key={n.id}
                  item={n}
                  onPress={() => { }} // TODO: Linking.openURL(n.article_url)
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 18, paddingTop: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerLblRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  headerLbl: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3 },
  headerSub: { fontSize: 12, color: '#888' },
  marketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  marketDot: { width: 5, height: 5, borderRadius: 3 },
  marketBadgeTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  excToggle: { flexDirection: 'row', backgroundColor: '#EBEBEB', borderRadius: 10, padding: 2, gap: 2 },
  excBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  excBtnActive: { backgroundColor: '#0F2419' },
  excBtnTxt: { fontSize: 12, fontWeight: '700', color: '#888' },
  excBtnTxtActive: { color: '#fff' },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', padding: 16, marginBottom: 18 },
  chartMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  chartValueLbl: { fontSize: 13, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  chartChange: { fontSize: 12, fontWeight: '600', color: '#1D9E75' },
  chartRange: { alignItems: 'flex-end' },
  chartHiLo: { fontSize: 11, color: '#AAAAAA' },
  chartWrap: { height: CHART_H + 8, justifyContent: 'center', marginBottom: 12 },

  rangeRow: { flexDirection: 'row', gap: 4 },
  rangeTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F5F5' },
  rangeTabActive: { backgroundColor: '#0A0A0A' },
  rangeTabTxt: { fontSize: 11, fontWeight: '700', color: '#888' },
  rangeTabTxtActive: { color: '#fff' },

  sectionLbl: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  loadingRow: { height: 60, justifyContent: 'center', alignItems: 'center' },

  moversGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  moverCard: { width: (SW - 44) / 2, borderRadius: 14, borderWidth: 1, padding: 12 },
  moverCardGreen: { backgroundColor: '#fff', borderColor: '#1D9E7540' },
  moverCardRed: { backgroundColor: '#fff', borderColor: '#E24B4A40' },
  moverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moverTicker: { fontSize: 13, fontWeight: '700' },
  moverName: { fontSize: 10, color: '#AAAAAA', marginBottom: 6 },
  moverPrice: { fontSize: 12, color: '#555', marginBottom: 3 },
  moverPct: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  moverVol: { fontSize: 10, color: '#AAAAAA' },

  sectorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  sectorTile: { width: (SW - 36 - 10) / 2, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' },
  sectorLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  sectorPct: { fontSize: 18, fontWeight: '600' },

  breadthCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', padding: 16, marginBottom: 18 },
  breadthLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  advLbl: { fontSize: 10, fontWeight: '700', color: '#1D9E75' },
  uncLbl: { fontSize: 10, color: '#AAAAAA' },
  decLbl: { fontSize: 10, fontWeight: '700', color: '#E24B4A' },
  breadthBarWrap: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  breadthSeg: { height: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  statLbl: { fontSize: 10, color: '#AAAAAA', marginTop: 2 },

  newsCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden', marginBottom: 18 },
  newsRow: { padding: 13, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  newsInfo: { flex: 1 },
  newsTitle: { fontSize: 13, fontWeight: '600', color: '#0A0A0A', lineHeight: 18, marginBottom: 4 },
  newsMeta: { fontSize: 11, color: '#AAAAAA' },
});