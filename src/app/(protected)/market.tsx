import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DISPLAY_NAMES,
  fetchGroupedDay,
  fetchIconsBatched,
  fetchNews,
  fetchOHLC,
  fetchPrevDay,
  fetchRelatedCompanies,
  fetchRSI,
  fetchSMA,
  fetchTickerOverview,
  fmtBig,
  NewsItem,
  OHLCBar,
  QuoteItem,
  seedCandles,
  seedQuote,
  TickerOverview
} from '../../../api/market.api';

const { width, height } = Dimensions.get('window');

// ─── Ticker lists ─────────────────────────────────────────────────────────────

//const US_TICKERS = ['AAPL', 'MSFT'
  // 'AAPL','MSFT','NVDA','AMZN','GOOGL','TSLA','META','AVGO','BRK.B','JPM',
  // 'V','UNH','XOM','MA','LLY','HD','PG','MRK','COST','ABBV',
  // 'CVX','PEP','KO','ADBE','WMT','BAC','MCD','CRM','CSCO','ACN',
//];

const US_TICKERS = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'AVGO', 'JPM', 'V',
];

// NGX — Massive free tier covers US stocks only.
// We seed NGX data gracefully and note this in the UI.
const NGX_TICKERS = [
  'DANGCEM', 'GTCO', 'ZENITHBANK', 'MTNN', 'AIRTELAFRI', 'FBNH', 'UBA',
  'ACCESSCORP', 'SEPLAT', 'BUAFOODS', 'TRANSCORP', 'OKOMUOIL',
  'TOTAL', 'NESTLE', 'FLOURMILL', 'NB', 'CADBURY', 'UNILEVER', 'GUINNESS', 'WAPCO',
];

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Spark({ positive, w = 52, h = 22 }: { positive: boolean; w?: number; h?: number }) {
  const pts = positive ? [5, 4, 6, 3, 5, 2, 3, 1, 0] : [0, 1, 0, 3, 1, 4, 2, 5, 6];
  const max = Math.max(...pts), min = Math.min(...pts);
  const norm = pts.map(v => 1 - (v - min) / (max - min || 1));
  const step = w / (pts.length - 1);
  const col = positive ? '#00FF87' : '#FF3B30';
  return (
    <View style={{ width: w, height: h }}>
      {norm.slice(0, -1).map((y, i) => {
        const x1 = i * step, y1 = y * h;
        const x2 = (i + 1) * step, y2 = norm[i + 1] * h;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <View key={i} style={{
            position: 'absolute', left: x1, top: y1 - 1,
            width: len, height: 2, backgroundColor: col,
            transform: [{ rotate: `${ang}deg` }],
          }} />
        );
      })}
    </View>
  );
}

// ─── Candle Chart ─────────────────────────────────────────────────────────────

function CandleChart({ candles }: { candles: OHLCBar[] }) {
  const CHART_W = width - 48;
  const CHART_H = 170;
  if (!candles.length) return null;

  const prices = candles.flatMap(c => [c.h, c.l]);
  const max = Math.max(...prices), min = Math.min(...prices);
  const range = max - min || 1;
  const toY = (v: number) => ((max - v) / range) * CHART_H;
  const barW = Math.max((CHART_W / candles.length) * 0.55, 2);
  const gap = CHART_W / candles.length;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    f, val: (max - f * range).toFixed(0),
  }));

  return (
    <View>
      <View style={{ width: CHART_W, height: CHART_H }}>
        {/* Grid lines + Y labels */}
        {yLabels.map(({ f, val }) => (
          <View key={f} style={{ position: 'absolute', top: f * CHART_H, left: 0, right: 32, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#161616' }} />
          </View>
        ))}

        {/* Candle bodies + wicks */}
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const col = up ? '#00FF87' : '#FF3B30';
          const x = i * gap + gap / 2;
          const bodyTop = toY(Math.max(c.o, c.c));
          const bodyH = Math.max(Math.abs(toY(c.o) - toY(c.c)), 1.5);
          const wickTop = toY(c.h);
          const wickH = Math.max(toY(c.l) - wickTop, 1);
          return (
            <View key={i}>
              {/* Wick */}
              <View style={{ position: 'absolute', left: x - 0.5, top: wickTop, width: 1, height: wickH, backgroundColor: col, opacity: 0.7 }} />
              {/* Body */}
              <View style={{ position: 'absolute', left: x - barW / 2, top: bodyTop, width: barW, height: bodyH, backgroundColor: col, opacity: 0.9, borderRadius: 1 }} />
            </View>
          );
        })}

        {/* Y-axis price labels */}
        {yLabels.map(({ f, val }) => (
          <Text key={f} style={{ position: 'absolute', top: f * CHART_H - 8, right: 0, color: '#2A2A2A', fontSize: 8, fontFamily: 'Courier' }}>
            {val}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── RSI Bar ──────────────────────────────────────────────────────────────────

function RSIBar({ value }: { value: number }) {
  const pct = value / 100;
  const color = value > 70 ? '#FF3B30' : value < 30 ? '#00FF87' : '#FFD60A';
  const label = value > 70 ? 'OVERBOUGHT' : value < 30 ? 'OVERSOLD' : 'NEUTRAL';
  return (
    <View style={styles.rsiWrap}>
      <View style={styles.rsiHeader}>
        <Text style={styles.rsiLabel}>RSI(14)</Text>
        <Text style={[styles.rsiValue, { color }]}>{value.toFixed(1)}</Text>
        <View style={[styles.rsiTag, { borderColor: color + '40', backgroundColor: color + '12' }]}>
          <Text style={[styles.rsiTagText, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={styles.rsiTrack}>
        {/* Zones */}
        <View style={[styles.rsiZone, { left: '0%', width: '30%', backgroundColor: '#00FF8710' }]} />
        <View style={[styles.rsiZone, { left: '70%', width: '30%', backgroundColor: '#FF3B3010' }]} />
        {/* Needle */}
        <View style={[styles.rsiNeedle, { left: `${pct * 100}%`, backgroundColor: color }]} />
        {/* Bar fill */}
        <View style={[styles.rsiBar, { width: `${pct * 100}%`, backgroundColor: color + '40' }]} />
      </View>
      <View style={styles.rsiScale}>
        <Text style={styles.rsiScaleTxt}>0</Text>
        <Text style={styles.rsiScaleTxt}>30</Text>
        <Text style={styles.rsiScaleTxt}>70</Text>
        <Text style={styles.rsiScaleTxt}>100</Text>
      </View>
    </View>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const date = new Date(item.published_utc);
  const ago = (() => {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  })();

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(item.article_url).catch(() => { })}
      style={styles.newsCard}
      activeOpacity={0.75}
    >
      <View style={styles.newsTop}>
        <Text style={styles.newsSource}>{item.publisher?.name ?? 'News'}</Text>
        <View style={styles.newsTimeRow}>
          <Clock size={9} color="#333" />
          <Text style={styles.newsTime}>{ago}</Text>
        </View>
      </View>
      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.newsDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.newsFooter}>
        <ExternalLink size={9} color="#333" />
        <Text style={styles.newsLink}>Read full article</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

type DetailState = {
  overview: TickerOverview | null;
  prevBar: OHLCBar | null;
  candles: OHLCBar[];
  rsi: number | null;
  sma20: number | null;
  news: NewsItem[];
  relatedTickers: string[];
};

function DetailModal({
  quote, exchange, onClose, quotes, setSelected,
}: {
  quote: QuoteItem;
  exchange: 'US' | 'NGX';
  onClose: () => void;
  quotes: QuoteItem[];
  setSelected: (q: QuoteItem | null) => void;
}) {
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [candlesForPeriod, setCandlesForPeriod] = useState<OHLCBar[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const insets = useSafeAreaInsets();
  const ticker = quote.ticker;

  // Initial load
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }).start();

    const load = async () => {
      if (exchange === 'NGX') {
        const candles = seedCandles(ticker, 30);
        setDetail({ overview: null, prevBar: null, candles, rsi: null, sma20: null, news: [], relatedTickers: [] });
        setCandlesForPeriod(candles);
        setLoading(false);
        return;
      }

      // Group 1 — cheapest, needed for header render
      const [overview, prevBar] = await Promise.all([
        fetchTickerOverview(ticker),
        fetchPrevDay(ticker),
      ]);

      await new Promise(r => setTimeout(r, 350));

      // Group 2 — chart (fetchOHLC is now cached, so 2nd open = instant, 0 API calls)
      const [candles, rsi, sma20] = await Promise.all([
        fetchOHLC(ticker, '1M'),
        fetchRSI(ticker),
        fetchSMA(ticker, 20),
      ]);

      await new Promise(r => setTimeout(r, 350));

      // Group 3 — non-critical extras
      const [news, relatedTickers] = await Promise.all([
        fetchNews(ticker, 4),
        fetchRelatedCompanies(ticker),
      ]);

      const finalCandles = candles.length ? candles : seedCandles(ticker, 30);
      setDetail({ overview, prevBar, candles: finalCandles, rsi, sma20, news, relatedTickers });
      setCandlesForPeriod(finalCandles);
      setLoading(false);
    };

    load();
  }, [ticker]);

  // Period change
  // useEffect(() => {
  //   if (!detail || exchange === 'NGX') return;
  //   setLoadingCandles(true);
  //   fetchOHLC(ticker, period).then(bars => {
  //     setCandlesForPeriod(bars);
  //     setLoadingCandles(false);
  //   });
  // }, [period]);

  useEffect(() => {
    if (!detail || exchange === 'NGX') return;
    // fetchOHLC checks _ohlcCache first — if cached, returns instantly, no API call
    setLoadingCandles(true);
    fetchOHLC(ticker, period).then(bars => {
      const finalBars = bars.length ? bars : seedCandles(ticker, 30);
      setCandlesForPeriod(finalBars);
      setLoadingCandles(false);
    });
  }, [period]);

  const close = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }).start(onClose);
  };

  const currency = exchange === 'NGX' ? '₦' : '$';
  const isUp = quote.changePct >= 0;
  const upColor = '#00FF87';
  const downColor = '#FF3B30';
  const color = isUp ? upColor : downColor;
  const PERIODS = ['1D', '1W', '1M', '3M', '1Y'] as const;

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16, flex: 1, maxHeight: height * 0.92 }]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* ── Header ── */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {/* Company logo from Massive branding */}
              {detail?.overview?.iconUrl ? (
                <Image
                  source={{ uri: detail.overview.iconUrl }}
                  style={styles.companyIcon}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.companyIconFallback, { borderColor: color + '40' }]}>
                  <Text style={[styles.companyIconLetter, { color }]}>{ticker[0]}</Text>
                </View>
              )}
              <View>
                <Text style={[styles.sheetTicker, { color }]}>{ticker}</Text>
                <Text style={styles.sheetName} numberOfLines={1}>
                  {detail?.overview?.name ?? DISPLAY_NAMES[ticker] ?? ticker}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={close} style={styles.sheetCloseBtn}>
              <X size={15} color="#777" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color="#00FF87" />
              <Text style={styles.loadingTxt}>FETCHING {ticker}...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

              {/* ── Price block ── */}
              <View style={styles.priceBlock}>
                <Text style={styles.priceMain}>{currency}{quote.price.toFixed(2)}</Text>
                <View style={styles.priceChangeRow}>
                  {isUp ? <ArrowUpRight size={14} color={upColor} /> : <ArrowDownRight size={14} color={downColor} />}
                  <Text style={[styles.pricePct, { color }]}>
                    {isUp ? '+' : ''}{quote.changePct.toFixed(2)}%
                  </Text>
                  <Text style={[styles.priceAbs, { color }]}>
                    ({isUp ? '+' : ''}{currency}{Math.abs(quote.change).toFixed(2)}) today
                  </Text>
                </View>
                {detail?.overview?.marketCap ? (
                  <Text style={styles.mktCap}>
                    Mkt Cap {fmtBig(detail.overview.marketCap)} · {detail.overview.employees.toLocaleString()} employees
                  </Text>
                ) : null}
              </View>

              {/* ── Period selector ── */}
              <View style={styles.periodRow}>
                {PERIODS.map(p => (
                  <TouchableOpacity key={p} onPress={() => setPeriod(p)}
                    style={[styles.periodBtn, period === p && [styles.periodBtnActive, { borderColor: color + '40' }]]}>
                    <Text style={[styles.periodTxt, period === p && { color }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Candle chart ── */}
              <View style={styles.candleWrap}>
                {loadingCandles ? (
                  <View style={[styles.chartLoadingWrap, { height: 170 }]}>
                    <ActivityIndicator size="small" color="#00FF87" />
                  </View>
                ) : (
                  <CandleChart candles={candlesForPeriod} />
                )}
              </View>

              {/* ── OHLCV stats ── */}
              <View style={styles.statsGrid}>
                {[
                  { label: 'OPEN', value: `${currency}${quote.open.toFixed(2)}` },
                  { label: 'HIGH', value: `${currency}${quote.high.toFixed(2)}` },
                  { label: 'LOW', value: `${currency}${quote.low.toFixed(2)}` },
                  { label: 'PREV', value: `${currency}${quote.prevClose.toFixed(2)}` },
                  { label: 'VOLUME', value: fmtBig(quote.volume, '') },
                  { label: 'VWAP', value: detail?.prevBar?.vw ? `${currency}${detail.prevBar.vw.toFixed(2)}` : 'N/A' },
                  { label: 'SMA20', value: detail?.sma20 ? `${currency}${detail.sma20.toFixed(2)}` : 'N/A' },
                  { label: 'LISTED', value: detail?.overview?.listDate ?? 'N/A' },
                  { label: 'EXCH', value: detail?.overview?.exchange ?? (exchange === 'NGX' ? 'NGX' : 'N/A') },
                ].map(s => (
                  <View key={s.label} style={styles.statCell}>
                    <Text style={styles.statCellLbl}>{s.label}</Text>
                    <Text style={styles.statCellVal}>{s.value}</Text>
                  </View>
                ))}
              </View>

              {/* ── RSI indicator ── */}
              {detail?.rsi != null && (
                <View style={styles.sectionPad}>
                  <RSIBar value={detail.rsi} />
                </View>
              )}

              {/* ── Description ── */}
              {detail?.overview?.description ? (
                <View style={styles.descCard}>
                  <Text style={styles.descLabel}>ABOUT</Text>
                  <Text style={styles.descText} numberOfLines={5}>
                    {detail.overview.description}
                  </Text>
                  {detail.overview.homepageUrl ? (
                    <TouchableOpacity onPress={() => Linking.openURL(detail!.overview!.homepageUrl).catch(() => { })}
                      style={styles.descLink}>
                      <Globe size={10} color="#0A84FF" />
                      <Text style={styles.descLinkTxt}>{detail.overview.homepageUrl.replace('https://', '')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* ── News ── */}
              {detail?.news?.length ? (
                <View style={styles.sectionPad}>
                  <View style={styles.sectionRow}>
                    <Zap size={11} color="#FFD60A" />
                    <Text style={[styles.sectionLbl, { color: '#FFD60A' }]}>LATEST NEWS</Text>
                  </View>
                  {detail.news.map(n => <NewsCard key={n.id} item={n} />)}
                </View>
              ) : null}

              {/* ── Related Companies ── */}
              {detail?.relatedTickers?.length ? (
                <View style={styles.sectionPad}>
                  <View style={styles.sectionRow}>
                    <TrendingUp size={11} color="#0A84FF" />
                    <Text style={[styles.sectionLbl, { color: '#0A84FF' }]}>RELATED COMPANIES</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {detail.relatedTickers.map(rt => {
                      const rtQuote = quotes.find((q: QuoteItem) => q.ticker === rt);
                      const rtUp = (rtQuote?.changePct ?? 0) >= 0;
                      const rtCol = rtUp ? '#00FF87' : '#FF3B30';
                      return (
                        <TouchableOpacity
                          key={rt}
                          onPress={() => {
                            // Find or seed a quote for this related ticker
                            const found = quotes.find((q: QuoteItem) => q.ticker === rt);
                            if (found) {
                              setSelected(found);
                            } else {
                              // Not in current list — seed a minimal quote and open
                              const seeded = seedQuote(rt);
                              setSelected(seeded);
                            }
                          }}
                          style={[styles.relatedChip, { borderColor: rtCol + '28', backgroundColor: rtCol + '0A' }]}
                        >
                          <Text style={[styles.relatedTicker, { color: rtCol }]}>{rt}</Text>
                          {rtQuote ? (
                            <>
                              <Text style={[styles.relatedPrice, { color: '#888' }]}>
                                ${rtQuote.price.toFixed(0)}
                              </Text>
                              <Text style={[styles.relatedPct, { color: rtCol }]}>
                                {rtUp ? '+' : ''}{rtQuote.changePct.toFixed(2)}%
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.relatedSub}>{DISPLAY_NAMES[rt] ?? rt}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* ── Exchange badge ── */}
              <View style={styles.exBadge}>
                {exchange === 'US'
                  ? <Globe size={10} color="#0A84FF" />
                  : <BarChart2 size={10} color="#00FF87" />}
                <Text style={[styles.exBadgeTxt, { color: exchange === 'US' ? '#0A84FF' : '#00FF87' }]}>
                  {exchange === 'US' ? 'NYSE · NASDAQ · US MARKETS' : 'NIGERIAN EXCHANGE · NGX'}
                </Text>
              </View>

              {/* ── Buy / Sell ── */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: upColor }]}>
                  <TrendingUp size={15} color="#050505" />
                  <Text style={styles.actionTxt}>BUY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: downColor }]}>
                  <TrendingDown size={15} color="#050505" />
                  <Text style={styles.actionTxt}>SELL</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Quote Row ────────────────────────────────────────────────────────────────

function QuoteRow({
  item, index, exchange, onPress,
}: {
  item: QuoteItem; index: number; exchange: 'US' | 'NGX'; onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index, 18) * 35;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, delay, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, delay, tension: 150, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const up = item.changePct >= 0;
  const cur = exchange === 'NGX' ? '₦' : '$';
  const col = up ? '#00FF87' : '#FF3B30';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={styles.qRow}>
        {/* Ticker */}
        <View style={[styles.qBadge, { borderColor: col + '25' }]}>
          {item.iconUrl ? (
            <Image
              source={{ uri: item.iconUrl }}
              style={styles.qBadgeIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.qBadgeTxt, { color: col }]}>
              {item.ticker.slice(0, 6)}
            </Text>
          )}
        </View>
        {/* Name + vol */}
        <View style={styles.qMeta}>
          <Text style={styles.qNameTxt} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.qVolTxt}>VOL {fmtBig(item.volume, '')}</Text>
        </View>
        {/* Spark */}
        <Spark positive={up} />
        {/* Price */}
        <View style={styles.qPriceCol}>
          <Text style={styles.qPriceTxt}>{cur}{item.price.toFixed(2)}</Text>
          <View style={styles.qChangePill}>
            {up ? <ArrowUpRight size={9} color={col} /> : <ArrowDownRight size={9} color={col} />}
            <Text style={[styles.qChangeTxt, { color: col }]}>{Math.abs(item.changePct).toFixed(2)}%</Text>
          </View>
        </View>
        <ChevronRight size={11} color="#1E1E1E" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.6, duration: 750, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.25, duration: 750, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[styles.qRow, { opacity: pulse }]}>
      <View style={[styles.qBadge, { backgroundColor: '#181818', borderColor: '#181818' }]} />
      <View style={styles.qMeta}>
        <View style={{ height: 10, width: '62%', backgroundColor: '#181818', borderRadius: 5 }} />
        <View style={{ height: 8, width: '38%', backgroundColor: '#141414', borderRadius: 4, marginTop: 5 }} />
      </View>
      <View style={{ width: 58, height: 28, backgroundColor: '#181818', borderRadius: 6 }} />
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MarketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exchange?: string; ticker?: string }>();
  const initEx = (params.exchange ?? 'US') as 'US' | 'NGX';
  const initTicker = params.ticker as string | undefined;

  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEx, setActiveEx] = useState<'US' | 'NGX'>(initEx);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selected, setSelected] = useState<QuoteItem | null>(null);
  const [marketOpen, setMarketOpen] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    let data: QuoteItem[];
    if (activeEx === 'US') {
      // Real Massive API — grouped daily market summary
      data = await fetchGroupedDay(US_TICKERS);
    } else {
      // NGX not on free tier — use seeds
      data = NGX_TICKERS.map(seedQuote);
    }
    setQuotes(data);
    setLoading(false);
    setRefreshing(false);
     // ── Lazy icon fetch — runs after prices are on screen ──
  if (activeEx === 'US') {
    fetchIconsBatched(US_TICKERS, (patch) => {
      // patch = { AAPL: 'https://...', MSFT: 'https://...' }
      setQuotes(prev =>
        prev.map(q => patch[q.ticker] ? { ...q, iconUrl: patch[q.ticker] } : q)
      );
    });
  }
  }, [activeEx]);

  // Market status
  useEffect(() => {
    if (activeEx === 'US') {
      import('../../../api/market.api').then(({ fetchMarketStatus }) => {
        fetchMarketStatus().then(s => {
          if (s) setMarketOpen(s.market);
        });
      });
    }
  }, [activeEx]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    load();
  }, [activeEx]);

  // Auto-open ticker passed from home screen
  useEffect(() => {
    if (initTicker && quotes.length) {
      const found = quotes.find(q => q.ticker === initTicker);
      if (found) setSelected(found);
    }
  }, [initTicker, quotes]);

  const filtered = query.trim()
    ? quotes.filter(q =>
      q.ticker.toLowerCase().includes(query.toLowerCase()) ||
      q.name.toLowerCase().includes(query.toLowerCase())
    )
    : quotes;

  const gainers = [...quotes].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = [...quotes].sort((a, b) => a.changePct - b.changePct).slice(0, 3);

  const statusColor = marketOpen === 'open' ? '#00FF87' : marketOpen === 'extended-hours' ? '#FFD60A' : '#FF3B30';
  const statusLabel = marketOpen === 'open' ? 'OPEN' : marketOpen === 'extended-hours' ? 'EXT HRS' : marketOpen === 'closed' ? 'CLOSED' : '...';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={17} color="#777" />
        </TouchableOpacity>

        {/* Exchange toggle */}
        <View style={styles.exTabs}>
          {(['US', 'NGX'] as const).map(ex => (
            <TouchableOpacity key={ex} onPress={() => { setActiveEx(ex); setQuery(''); setShowSearch(false); }}
              style={[styles.exTab, activeEx === ex && styles.exTabActive]}>
              {activeEx === ex && ex === 'US' ? <Globe size={10} color="#0A84FF" /> : null}
              {activeEx === ex && ex === 'NGX' ? <BarChart2 size={10} color="#00FF87" /> : null}
              <Text style={[styles.exTabTxt, activeEx === ex && (ex === 'US' ? { color: '#0A84FF' } : { color: '#00FF87' })]}>
                {ex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setShowSearch(s => !s)} style={[styles.headerBtn, showSearch && { borderColor: '#00FF8740', backgroundColor: '#00FF8710' }]}>
          <Search size={15} color={showSearch ? '#00FF87' : '#777'} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Search bar ── */}
      {showSearch && (
        <Animated.View style={styles.searchWrap}>
          <Search size={12} color="#3A3A3A" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${activeEx === 'US' ? 'US' : 'NGX'} tickers...`}
            placeholderTextColor="#2E2E2E"
            style={styles.searchInput}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={12} color="#444" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* ── Market status + movers strip ── */}
      {!query && !loading && (
        <View style={styles.moversWrap}>
          {/* Status pill */}
          <View style={[styles.statusPill, { borderColor: statusColor + '35', backgroundColor: statusColor + '0D' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {gainers.map(q => (
              <TouchableOpacity key={q.ticker} onPress={() => setSelected(q)}
                style={[styles.moverChip, { borderColor: '#00FF8730', backgroundColor: '#00FF870A' }]}>
                <Text style={[styles.moverTicker, { color: '#00FF87' }]}>{q.ticker}</Text>
                <ArrowUpRight size={8} color="#00FF87" />
                <Text style={[styles.moverPct, { color: '#00FF87' }]}>+{q.changePct.toFixed(2)}%</Text>
              </TouchableOpacity>
            ))}
            {losers.map(q => (
              <TouchableOpacity key={q.ticker} onPress={() => setSelected(q)}
                style={[styles.moverChip, { borderColor: '#FF3B3030', backgroundColor: '#FF3B300A' }]}>
                <Text style={[styles.moverTicker, { color: '#FF3B30' }]}>{q.ticker}</Text>
                <ArrowDownRight size={8} color="#FF3B30" />
                <Text style={[styles.moverPct, { color: '#FF3B30' }]}>{q.changePct.toFixed(2)}%</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── NGX free tier notice ── */}
      {activeEx === 'NGX' && !query && (
        <View style={styles.ngxNotice}>
          <Activity size={10} color="#FFD60A" />
          <Text style={styles.ngxNoticeTxt}>NGX data is seeded — Massive free tier covers US stocks only</Text>
        </View>
      )}

      {/* ── Count row ── */}
      <View style={styles.countRow}>
        <Text style={styles.countTxt}>
          {loading ? 'LOADING...' : `${filtered.length} TICKERS · ${activeEx === 'US' ? 'NYSE / NASDAQ' : 'NIGERIAN EXCHANGE'}`}
        </Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }}>
          <RefreshCw size={11} color="#2A2A2A" />
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.skeletonWrap} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 14 }).map((_, i) => <SkeletonRow key={i} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.ticker}
          contentContainerStyle={styles.flatContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#00FF87" colors={['#00FF87']} />
          }
          renderItem={({ item, index }) => (
            <QuoteRow item={item} index={index} exchange={activeEx} onPress={() => setSelected(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTxt}>NO MATCHES FOR "{query.toUpperCase()}"</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <DetailModal
          quote={selected}
          exchange={activeEx}
          onClose={() => setSelected(null)}
          quotes={quotes}
          setSelected={setSelected}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const STAT_W = (width - 56) / 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0A84FF22', justifyContent: 'center', alignItems: 'center' },
  exTabs: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#0A84FF22', overflow: 'hidden' },
  exTab: { flex: 1, paddingVertical: 9, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  exTabActive: { backgroundColor: '#161616' },
  exTabTxt: { color: '#3A3A3A', fontSize: 11, fontFamily: 'Courier', fontWeight: '800', letterSpacing: 1 },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#0D0D0D', borderRadius: 10, borderWidth: 1, borderColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: '#E0E0E0', fontSize: 12, fontFamily: 'Courier' },

  // Movers
  moversWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 8, fontFamily: 'Courier', fontWeight: '800', letterSpacing: 1 },
  moverChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  moverTicker: { fontSize: 9, fontWeight: '800', fontFamily: 'Courier' },
  moverPct: { fontSize: 8, fontFamily: 'Courier', fontWeight: '700' },

  // NGX notice
  ngxNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FFD60A08', borderWidth: 1, borderColor: '#FFD60A20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  ngxNoticeTxt: { color: '#FFD60A', fontSize: 9, fontFamily: 'Courier' },

  // Count
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  countTxt: { color: '#282828', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },

  // List
  flatContent: { paddingHorizontal: 16 },
  skeletonWrap: { paddingHorizontal: 16 },
  qRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#0D0D0D', gap: 10 },
  qBadge: { width: 56, height: 32, borderRadius: 7, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090909' },
  qBadgeIcon: { width: 28, height: 28, borderRadius: 7 },
  qBadgeTxt: { fontSize: 9, fontWeight: '900', fontFamily: 'Courier', letterSpacing: 0.5 },
  qMeta: { flex: 1, gap: 2 },
  qNameTxt: { color: '#253357', fontSize: 11, fontWeight: '600', fontFamily: 'Courier' },
  qVolTxt: { color: '#252525', fontSize: 9, fontFamily: 'Courier' },
  qPriceCol: { alignItems: 'flex-end', gap: 2 },
  qPriceTxt: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  qChangePill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  qChangeTxt: { fontSize: 10, fontWeight: '700', fontFamily: 'Courier' },
  emptyWrap: { paddingTop: 60, alignItems: 'center' },
  emptyTxt: { color: '#252525', fontSize: 11, fontFamily: 'Courier', letterSpacing: 1 },

  // Related tickers
  relatedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  relatedTicker: { fontSize: 11, fontWeight: '800', fontFamily: 'Courier' },
  relatedPrice: { fontSize: 10, fontFamily: 'Courier', fontWeight: '600' },
  relatedPct: { fontSize: 9, fontFamily: 'Courier', fontWeight: '700' },
  relatedSub: { fontSize: 9, color: '#666', fontFamily: 'Courier' },

  // Modal sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: "#F7F7F7"},
  sheet: { backgroundColor: '#F7F7F7', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#090a0922', maxHeight: height * 0.92, minHeight: height * 0.8, paddingTop: 10 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#252525', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sheetTicker: { fontSize: 20, fontWeight: '900', fontFamily: 'Courier', letterSpacing: 0.8 },
  sheetName: { color: '#484848', fontSize: 11, fontFamily: 'Courier', marginTop: 1, maxWidth: width * 0.55 },
  sheetCloseBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#00FF8722', justifyContent: 'center', alignItems: 'center' },
  companyIcon: { width: 36, height: 36, borderRadius: 8 },
  companyIconFallback: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#111', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  companyIconLetter: { fontSize: 16, fontWeight: '900', fontFamily: 'Courier' },

  loadingBlock: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingTxt: { color: '#2A2A2A', fontSize: 10, fontFamily: 'Courier', letterSpacing: 2 },

  // Price block
  priceBlock: { paddingHorizontal: 20, marginBottom: 14 },
  priceMain: { color: '#253357', fontSize: 32, fontWeight: '800', fontFamily: 'Courier', letterSpacing: -0.5 },
  priceChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pricePct: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier' },
  priceAbs: { fontSize: 11, fontFamily: 'Courier' },
  mktCap: { color: '#253357', fontSize: 10, fontFamily: 'Courier', marginTop: 5 },

  // Period
  periodRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 14 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  periodBtnActive: { backgroundColor: '#141414' },
  periodTxt: { color: '#383838', fontSize: 11, fontFamily: 'Courier', fontWeight: '700' },

  // Chart
  candleWrap: { paddingHorizontal: 20, marginBottom: 18 },
  chartLoadingWrap: { justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 4, marginBottom: 14 },
  statCell: { width: STAT_W, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#00FF8722', padding: 10, alignItems: 'center', gap: 3 },
  statCellLbl: { color: '#253357', fontSize: 8, fontFamily: 'Courier', letterSpacing: 1 },
  statCellVal: { color: '#C0C0C0', fontSize: 11, fontWeight: '700', fontFamily: 'Courier' },

  sectionPad: { paddingHorizontal: 20, marginBottom: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLbl: { fontSize: 10, fontFamily: 'Courier', letterSpacing: 2 },

  // RSI
  rsiWrap: { gap: 6 },
  rsiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rsiLabel: { color: '#333', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },
  rsiValue: { fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
  rsiTag: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  rsiTagText: { fontSize: 8, fontFamily: 'Courier', fontWeight: '800', letterSpacing: 1 },
  rsiTrack: { height: 8, backgroundColor: '#141414', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  rsiZone: { position: 'absolute', top: 0, bottom: 0 },
  rsiBar: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 4 },
  rsiNeedle: { position: 'absolute', top: -1, width: 3, height: 10, borderRadius: 1.5, marginLeft: -1.5 },
  rsiScale: { flexDirection: 'row', justifyContent: 'space-between' },
  rsiScaleTxt: { color: '#282828', fontSize: 8, fontFamily: 'Courier' },

  // Description
  descCard: { marginHorizontal: 20, marginBottom: 14, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#00FF8722', padding: 14, gap: 8 },
  descLabel: { color: '#2A2A2A', fontSize: 8, fontFamily: 'Courier', letterSpacing: 2 },
  descText: { color: '#606060', fontSize: 11, fontFamily: 'Courier', lineHeight: 17 },
  descLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  descLinkTxt: { color: '#0A84FF', fontSize: 10, fontFamily: 'Courier' },

  // News
  newsCard: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#00FF8722', padding: 12, marginBottom: 8, gap: 6 },
  newsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsSource: { color: '#333', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },
  newsTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  newsTime: { color: '#2A2A2A', fontSize: 8, fontFamily: 'Courier' },
  newsTitle: { color: '#C0C0C0', fontSize: 12, fontFamily: 'Courier', lineHeight: 17, fontWeight: '600' },
  newsDesc: { color: '#484848', fontSize: 10, fontFamily: 'Courier', lineHeight: 15 },
  newsFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newsLink: { color: '#2A2A2A', fontSize: 9, fontFamily: 'Courier' },

  // Exchange badge
  exBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginBottom: 16, backgroundColor: '#0D0D0D', borderRadius: 8, borderWidth: 1, borderColor: '#181818', paddingHorizontal: 12, paddingVertical: 8 },
  exBadgeTxt: { fontSize: 10, fontFamily: 'Courier', letterSpacing: 1 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  actionTxt: { color: '#050505', fontSize: 14, fontWeight: '900', fontFamily: 'Courier', letterSpacing: 1.5 },
});