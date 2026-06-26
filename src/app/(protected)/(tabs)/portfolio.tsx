// import { useColors } from '@/theme/useColor';
// import {
//   ArrowDownRight,
//   ArrowUpRight,
//   Layers,
//   TrendingDown,
//   TrendingUp
// } from 'lucide-react-native';
// import { useEffect, useRef, useState } from 'react';
// import {
//   Animated,
//   Dimensions,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window');


// // ─── Mock Data ────────────────────────────────────────────────────────────────

// const HOLDINGS = [
//   { ticker: 'NVDA', name: 'NVIDIA Corp', shares: 12, avg: 412.5, current: 891.2, change: 5.14 },
//   { ticker: 'TSLA', name: 'Tesla Inc', shares: 8, avg: 220.0, current: 178.4, change: -2.87 },
//   { ticker: 'AAPL', name: 'Apple Inc', shares: 25, avg: 155.3, current: 189.5, change: 0.43 },
//   { ticker: 'MSFT', name: 'Microsoft', shares: 5, avg: 310.0, current: 415.8, change: 1.22 },
//   { ticker: 'AMZN', name: 'Amazon', shares: 10, avg: 128.0, current: 183.9, change: -0.65 },
//   { ticker: 'META', name: 'Meta Platforms', shares: 7, avg: 290.0, current: 512.3, change: 3.78 },
// ];

// const TOTAL_VALUE = HOLDINGS.reduce((s, h) => s + h.current * h.shares, 0);
// const TOTAL_COST = HOLDINGS.reduce((s, h) => s + h.avg * h.shares, 0);
// const TOTAL_GAIN = TOTAL_VALUE - TOTAL_COST;
// const TOTAL_GAIN_PCT = (TOTAL_GAIN / TOTAL_COST) * 100;

// // ─── Allocation Bar ────────────────────────────────────────────────────────────

// const BAR_COLORS = ['#00FF87', '#FF3B30', '#0A84FF', '#FFD60A', '#FF9F0A', '#BF5AF2'];

// function AllocationBar() {
//   const segments = HOLDINGS.map((h, i) => ({
//     pct: (h.current * h.shares) / TOTAL_VALUE,
//     color: BAR_COLORS[i],
//     ticker: h.ticker,
//   }));

//   return (
//     <View style={styles.allocBar}>
//       {segments.map((seg, i) => (
//         <View
//           key={seg.ticker}
//           style={[
//             styles.allocSegment,
//             {
//               flex: seg.pct,
//               backgroundColor: seg.color,
//               borderRadius: i === 0 ? 3 : i === segments.length - 1 ? 3 : 0,
//             },
//           ]}
//         />
//       ))}
//     </View>
//   );
// }

// // ─── Mini Sparkline (SVG-less, pure RN) ────────────────────────────────────────

// function Sparkline({ positive }: { positive: boolean }) {
//   const points = positive
//     ? [10, 8, 12, 7, 11, 6, 9, 4, 2, 1]
//     : [1, 3, 2, 5, 4, 7, 5, 8, 9, 10];
//   const max = Math.max(...points);
//   const min = Math.min(...points);
//   const norm = points.map((p) => 1 - (p - min) / (max - min));
//   const H = 24;
//   const W = 48;
//   const step = W / (points.length - 1);

//   return (
//     <View style={{ width: W, height: H }}>
//       {norm.slice(0, -1).map((y, i) => {
//         const x1 = i * step;
//         const y1 = y * H;
//         const x2 = (i + 1) * step;
//         const y2 = norm[i + 1] * H;
//         const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
//         const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
//         return (
//           <View
//             key={i}
//             style={{
//               position: 'absolute',
//               left: x1,
//               top: y1 - 1,
//               width: len,
//               height: 1.5,
//               backgroundColor: positive ? '#00FF87' : '#FF3B30',
//               transform: [{ rotate: `${angle}deg` }, { translateX: 0 }],
//               transformOrigin: '0 50%',
//             }}
//           />
//         );
//       })}
//     </View>
//   );
// }

// // ─── Holding Row ──────────────────────────────────────────────────────────────

// function HoldingRow({ item, index }: { item: (typeof HOLDINGS)[0]; index: number }) {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(20)).current;
//   const isUp = item.change >= 0;
//   const gainAmt = (item.current - item.avg) * item.shares;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 350,
//         delay: index * 60,
//         useNativeDriver: true,
//       }),
//       Animated.spring(slideAnim, {
//         toValue: 0,
//         delay: index * 60,
//         tension: 120,
//         friction: 10,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   return (
//     <Animated.View
//       style={[
//         styles.holdingRow,
//         { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
//       ]}
//     >
//       {/* Ticker Badge */}
//       <View style={[styles.tickerBadge, { borderColor: isUp ? '#00FF8730' : '#FF3B3030' }]}>
//         <Text style={[styles.tickerText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
//           {item.ticker}
//         </Text>
//       </View>

//       {/* Name + Shares */}
//       <View style={styles.holdingMeta}>
//         <Text style={styles.holdingName}>{item.name}</Text>
//         <Text style={styles.holdingShares}>{item.shares} shares · avg ${item.avg.toFixed(2)}</Text>
//       </View>

//       {/* Sparkline */}
//       <Sparkline positive={isUp} />

//       {/* Price + Change */}
//       <View style={styles.holdingPriceCol}>
//         <Text style={styles.holdingCurrentPrice}>${item.current.toFixed(2)}</Text>
//         <View style={styles.changePill}>
//           {isUp ? (
//             <ArrowUpRight size={10} color="#00FF87" />
//           ) : (
//             <ArrowDownRight size={10} color="#FF3B30" />
//           )}
//           <Text style={[styles.changeText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
//             {Math.abs(item.change).toFixed(2)}%
//           </Text>
//         </View>
//         <Text style={[styles.gainAmt, { color: gainAmt >= 0 ? '#00FF87' : '#FF3B30' }]}>
//           {gainAmt >= 0 ? '+' : ''}${gainAmt.toFixed(0)}
//         </Text>
//       </View>
//     </Animated.View>
//   );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// export default function PortfolioScreen() {
//   const headerAnim = useRef(new Animated.Value(0)).current;
//   const [activeFilter, setActiveFilter] = useState('All');
//   const FILTERS = ['All', 'Gainers', 'Losers', 'Watchlist'];
//   const c = useColors();

//   useEffect(() => {
//     Animated.timing(headerAnim, {
//       toValue: 1,
//       duration: 500,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const isUp = TOTAL_GAIN >= 0;

//   return (
//     <SafeAreaView style={styles.root } edges={['top']}>
//       <StatusBar barStyle="light-content" />
//       <ScrollView
//         contentContainerStyle={styles.scroll}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Header ── */}
//         <Animated.View style={[styles.header, { opacity: headerAnim }]}>
//           <View style={styles.headerTop}>
//             <View>
//               <Text style={styles.screenLabel}>PORTFOLIO</Text>
//               <Text style={styles.totalValue}>
//                 ${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
//               </Text>
//             </View>
//             <View style={styles.overallBadge}>
//               {isUp ? (
//                 <TrendingUp size={14} color="#00FF87" />
//               ) : (
//                 <TrendingDown size={14} color="#FF3B30" />
//               )}
//               <Text style={[styles.overallPct, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
//                 {isUp ? '+' : ''}
//                 {TOTAL_GAIN_PCT.toFixed(2)}%
//               </Text>
//             </View>
//           </View>

//           <Text style={[styles.totalGainLine, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
//             {isUp ? '+' : ''}${TOTAL_GAIN.toLocaleString('en-US', { minimumFractionDigits: 2 })} all time
//           </Text>
//         </Animated.View>

//         {/* ── Allocation Bar ── */}
//         <View style={styles.allocSection}>
//           <View style={styles.sectionHeaderRow}>
//             <Layers size={12} color="#555" />
//             <Text style={styles.sectionLabel}>ALLOCATION</Text>
//           </View>
//           <AllocationBar />
//           <View style={styles.allocLegend}>
//             {HOLDINGS.map((h, i) => (
//               <View key={h.ticker} style={styles.legendItem}>
//                 <View style={[styles.legendDot, { backgroundColor: BAR_COLORS[i] }]} />
//                 <Text style={styles.legendText}>{h.ticker}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* ── Divider ── */}
//         <View style={styles.divider} />

//         {/* ── Filter Tabs ── */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.filterRow}
//         >
//           {FILTERS.map((f) => (
//             <TouchableOpacity
//               key={f}
//               onPress={() => setActiveFilter(f)}
//               style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
//             >
//               <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
//                 {f}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* ── Holdings List ── */}
//         <View style={styles.holdingsList}>
//           {HOLDINGS.filter((h) => {
//             if (activeFilter === 'Gainers') return h.change >= 0;
//             if (activeFilter === 'Losers') return h.change < 0;
//             return true;
//           }).map((item, i) => (
//             <HoldingRow key={item.ticker} item={item} index={i} />
//           ))}
//         </View>

//         {/* ── Bottom Pad ── */}
//         <View style={{ height: 100 }} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// // ─── Styles ────────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   // use a fixed background color to avoid referencing theme hook outside component
//   root: { flex: 1, backgroundColor: '#F7F7F7' },
//   scroll: { paddingHorizontal: 20 },

//   header: { paddingTop: 20, paddingBottom: 12 },
//   headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
//   screenLabel: { fontFamily: 'Courier', fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 8 },
//   totalValue: {
//     color: '#253357',
//     fontSize: 36,
//     fontWeight: '700',
//     letterSpacing: -1,
//     fontFamily: 'Courier',
//   },
//   overallBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     backgroundColor: '#FAFAFA',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderWidth: 1,
//     borderColor: '#E8E8E8',
//   },
//   overallPct: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier' },
//   totalGainLine: { fontSize: 13, fontFamily: 'Courier', marginTop: 4 },

//   allocSection: { marginTop: 16 },
//   sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
//   sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },
//   allocBar: {
//     flexDirection: 'row',
//     height: 6,
//     borderRadius: 3,
//     overflow: 'hidden',
//     gap: 1,
//   },
//   allocSegment: { height: 6 },
//   allocLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
//   legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   legendDot: { width: 6, height: 6, borderRadius: 3 },
//   legendText: { color: '#555', fontSize: 10, fontFamily: 'Courier' },

//   divider: { height: 1, backgroundColor: '#141414', marginVertical: 20 },

//   filterRow: { gap: 8, paddingBottom: 16 },
//   filterChip: {
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: '#E8E8E8',
//     backgroundColor: '#FBFEFB',
//   },
//   filterChipActive: { backgroundColor: '#1A1A1A', borderColor: '#333' },
//   filterText: { color: '#444', fontSize: 11, fontFamily: 'Courier', letterSpacing: 1 },
//   filterTextActive: { color: '#F5F5F5' },

//   holdingsList: { gap: 2 },
//   holdingRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 14,
//     paddingHorizontal: 14,
//     backgroundColor: '#FBFEFB',
//     borderRadius: 10,
//     marginBottom: 4,
//     borderWidth: 1,
//     borderColor: '#E8E8E8',
//     gap: 10,
//   },
//   tickerBadge: {
//     width: 52,
//     height: 32,
//     borderRadius: 6,
//     borderWidth: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FAFAFA',
//   },
//   tickerText: { fontSize: 11, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 0.5 },
//   holdingMeta: { flex: 1, gap: 2 },
//   holdingName: { color: '#253357', fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
//   holdingShares: { color: '#444', fontSize: 11, fontFamily: 'Courier' },
//   holdingPriceCol: { alignItems: 'flex-end', gap: 2 },
//   holdingCurrentPrice: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
//   changePill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 2,
//   },
//   changeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Courier' },
//   gainAmt: { fontSize: 10, fontFamily: 'Courier' },
// });

/**
 * PortfolioScreen.tsx
 * Unified portfolio screen combining NGX + US holdings.
 * Combined value hero with USD/NGN toggle, split US/NGX value cards,
 * allocation bar, exchange filter tabs, holdings list with badges.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type Exchange = 'US' | 'NGX';
type Currency = 'USD' | 'NGN';
type FilterKey = 'all' | 'us' | 'ngx' | 'gainers';

interface Holding {
  ticker: string;
  name: string;
  ex: Exchange;
  qty: string;
  avg: string;
  price: string;
  pct: number;
  up: boolean;
  gain: string;
}

const FX_RATE = 1533.20;

const MOCK_HOLDINGS: Holding[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', ex: 'US', qty: '12 shares', avg: 'avg $412.50', price: '$891.20', pct: 5.14, up: true, gain: '+$5,744' },
  { ticker: 'TSLA', name: 'Tesla Inc', ex: 'US', qty: '8 shares', avg: 'avg $220.00', price: '$178.40', pct: -2.87, up: false, gain: '-$333' },
  { ticker: 'AAPL', name: 'Apple Inc', ex: 'US', qty: '25 shares', avg: 'avg $155.30', price: '$189.50', pct: 0.43, up: true, gain: '+$855' },
  { ticker: 'GTCO', name: 'GT Holdings', ex: 'NGX', qty: '15,000 shares', avg: 'avg ₦38.20', price: '₦48.50', pct: 1.26, up: true, gain: '+₦154,500' },
  { ticker: 'DANGC', name: 'Dangote Cement', ex: 'NGX', qty: '2,500 shares', avg: 'avg ₦410.00', price: '₦452.00', pct: -0.25, up: false, gain: '-₦1,130' },
  { ticker: 'ZENITH', name: 'Zenith Bank', ex: 'NGX', qty: '8,000 shares', avg: 'avg ₦31.00', price: '₦36.20', pct: 3.20, up: true, gain: '+₦41,600' },
];

const PORTFOLIO_SUMMARY = {
  totalUsd: 31847.92,
  totalUsdGainAllTime: 8210.44,
  totalUsdPct: 34.7,
  usValueUsd: 24363.20,
  usGainUsd: 5610,
  usGainPct: 30,
  ngxValueNgn: 11508000,
  ngxGainNgn: 2300000,
  ngxGainPct: 25,
};

const ALLOCATION = [
  { ticker: 'NVDA', pct: 22, color: '#1D9E75' },
  { ticker: 'GTCO', pct: 30, color: '#1A7A41' },
  { ticker: 'TSLA', pct: 12, color: '#E24B4A' },
  { ticker: 'AAPL', pct: 14, color: '#378ADD' },
  { ticker: 'DANGC', pct: 11, color: '#EF9F27' },
  { ticker: 'Other', pct: 11, color: '#7F77DD' },
];

function fmtNGN(n: number) {
  return `₦${Math.round(n).toLocaleString('en-NG')}`;
}
function fmtUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <View style={styles.currToggle}>
      <TouchableOpacity
        style={[styles.currTab, value === 'USD' && styles.currTabActive]}
        onPress={() => onChange('USD')}
        activeOpacity={0.75}
      >
        <Text style={[styles.currTabTxt, value === 'USD' && styles.currTabTxtActive]}>USD</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.currTab, value === 'NGN' && styles.currTabActive]}
        onPress={() => onChange('NGN')}
        activeOpacity={0.75}
      >
        <Text style={[styles.currTabTxt, value === 'NGN' && styles.currTabTxtActive]}>NGN</Text>
      </TouchableOpacity>
    </View>
  );
}

function HoldingRow({ item, onPress }: { item: Holding; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.tickerBadge, { borderColor: item.up ? '#1D9E7540' : '#E24B4A40' }]}>
        <Text style={[styles.tickerBadgeTxt, { color: item.up ? '#1D9E75' : '#E24B4A' }]}>
          {item.ticker}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName}>{item.name}</Text>
          <View style={[styles.exBadge, { backgroundColor: item.ex === 'US' ? '#EEF0F2' : '#E8F5EC' }]}>
            <Text style={[styles.exBadgeTxt, { color: item.ex === 'US' ? '#444' : '#1A7A41' }]}>
              {item.ex}
            </Text>
          </View>
        </View>
        <Text style={styles.rowMeta}>{item.qty} · {item.avg}</Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{item.price}</Text>
        <Text style={[styles.rowPct, { color: item.up ? '#166634' : '#A32D2D' }]}>
          {item.up ? '▲' : '▼'} {Math.abs(item.pct)}% · {item.gain}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen() {
  const router = useRouter();

  const [currency, setCurrency] = useState<Currency>('USD');
  const [filter, setFilter] = useState<FilterKey>('all');

  const holdings = MOCK_HOLDINGS;
  const summary = PORTFOLIO_SUMMARY;

  const filteredHoldings = useMemo(() => {
    if (filter === 'us') return holdings.filter(h => h.ex === 'US');
    if (filter === 'ngx') return holdings.filter(h => h.ex === 'NGX');
    if (filter === 'gainers') return holdings.filter(h => h.up);
    return holdings;
  }, [holdings, filter]);

  const heroValue = currency === 'USD'
    ? fmtUSD(summary.totalUsd)
    : fmtNGN(summary.totalUsd * FX_RATE);

  const heroGain = currency === 'USD'
    ? `+${fmtUSD(summary.totalUsdGainAllTime)} all time`
    : `+${fmtNGN(summary.totalUsdGainAllTime * FX_RATE)} all time`;

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'us', label: '🇺🇸 US' },
    { key: 'ngx', label: '🇳🇬 NGX' },
    { key: 'gainers', label: 'Gainers' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Portfolio</Text>
            <Text style={styles.headerSub}>All holdings · NGX + US</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(protected)/settings' as any)}
            activeOpacity={0.7}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24">
              <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#888" strokeWidth={1.8} fill="none" />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke="#888" strokeWidth={1.5} fill="none"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>TOTAL PORTFOLIO VALUE</Text>
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </View>

          <Text style={styles.heroValue}>{heroValue}</Text>

          <View style={styles.heroGainRow}>
            <Text style={styles.heroGainTxt}>{heroGain}</Text>
            <View style={styles.heroPctPill}>
              <Text style={styles.heroPctTxt}>+{summary.totalUsdPct}%</Text>
            </View>
          </View>

          <View style={styles.splitRow}>
            <View style={styles.splitCard}>
              <View style={styles.splitFlagRow}>
                <View style={[styles.flagChip, { backgroundColor: '#3C3C3C' }]}>
                  <Text style={styles.flagChipTxt}>US</Text>
                </View>
                <Text style={styles.splitLabel}>US stocks</Text>
              </View>
              <Text style={styles.splitValue}>{fmtUSD(summary.usValueUsd)}</Text>
              <Text style={styles.splitGain}>
                +{fmtUSD(summary.usGainUsd)} · {summary.usGainPct}%
              </Text>
            </View>

            <View style={styles.splitCard}>
              <View style={styles.splitFlagRow}>
                <View style={[styles.flagChip, { backgroundColor: '#1A7A41' }]}>
                  <Text style={styles.flagChipTxt}>NG</Text>
                </View>
                <Text style={styles.splitLabel}>NGX stocks</Text>
              </View>
              <Text style={styles.splitValue}>{fmtNGN(summary.ngxValueNgn)}</Text>
              <Text style={styles.splitGain}>
                +{fmtNGN(summary.ngxGainNgn)} · {summary.ngxGainPct}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLbl}>ALLOCATION</Text>
        <View style={styles.allocBar}>
          {ALLOCATION.map((a, i) => (
            <View
              key={a.ticker}
              style={[
                styles.allocSeg,
                {
                  flex: a.pct,
                  backgroundColor: a.color,
                  borderTopLeftRadius: i === 0 ? 4 : 0,
                  borderBottomLeftRadius: i === 0 ? 4 : 0,
                  borderTopRightRadius: i === ALLOCATION.length - 1 ? 4 : 0,
                  borderBottomRightRadius: i === ALLOCATION.length - 1 ? 4 : 0,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.allocLegend}>
          {ALLOCATION.map(a => (
            <View key={a.ticker} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: a.color }]} />
              <Text style={styles.legendTxt}>{a.ticker} {a.pct}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterTabTxt, filter === f.key && styles.filterTabTxtActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLbl}>HOLDINGS</Text>
        <View style={styles.holdingsCard}>
          {filteredHoldings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTxt}>No holdings match this filter</Text>
            </View>
          ) : (
            filteredHoldings.map(item => (
              <HoldingRow
                key={item.ticker}
                item={item}
                onPress={() =>
                  router.push({
                    pathname: '/(protected)/market',
                    params: { exchange: item.ex, ticker: item.ticker },
                  } as any)
                }
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 18, paddingTop: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '500', color: '#0A0A0A', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  settingsBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5', borderWidth: 0.5, borderColor: '#E8E8E8',
    alignItems: 'center', justifyContent: 'center',
  },

  heroCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    padding: 18, marginBottom: 16,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1, textTransform: 'uppercase', flex: 1 },

  currToggle: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 2, gap: 2 },
  currTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  currTabActive: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E8E8E8' },
  currTabTxt: { fontSize: 11, fontWeight: '600', color: '#AAAAAA' },
  currTabTxtActive: { color: '#0A0A0A' },

  heroValue: { fontSize: 36, fontWeight: '500', color: '#0A0A0A', letterSpacing: -1, marginBottom: 4 },
  heroGainRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  heroGainTxt: { fontSize: 13, fontWeight: '600', color: '#166634' },
  heroPctPill: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  heroPctTxt: { fontSize: 10, fontWeight: '700', color: '#166634' },

  splitRow: { flexDirection: 'row', gap: 8 },
  splitCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12 },
  splitFlagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  flagChip: { width: 16, height: 12, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  flagChipTxt: { fontSize: 6, fontWeight: '700', color: '#fff' },
  splitLabel: { fontSize: 10, color: '#AAAAAA' },
  splitValue: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  splitGain: { fontSize: 10, fontWeight: '600', color: '#166634', marginTop: 2 },

  sectionLbl: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.2, marginBottom: 9, marginTop: 4 },

  allocBar: { flexDirection: 'row', height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  allocSeg: { height: 7 },
  allocLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendTxt: { fontSize: 10, color: '#AAAAAA' },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterTab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: '#F5F5F5' },
  filterTabActive: { backgroundColor: '#0F2419' },
  filterTabTxt: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterTabTxtActive: { color: '#fff' },

  holdingsCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: '#EBEBEB', overflow: 'hidden' },
  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyTxt: { fontSize: 12, color: '#AAAAAA' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5', gap: 11,
  },
  tickerBadge: { width: 42, height: 42, borderRadius: 11, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tickerBadgeTxt: { fontSize: 9, fontWeight: '700' },

  rowInfo: { flex: 1 },
  rowNameLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowName: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  exBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  exBadgeTxt: { fontSize: 8, fontWeight: '700' },
  rowMeta: { fontSize: 10, color: '#AAAAAA', marginTop: 2 },

  rowRight: { alignItems: 'flex-end' },
  rowPrice: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  rowPct: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});