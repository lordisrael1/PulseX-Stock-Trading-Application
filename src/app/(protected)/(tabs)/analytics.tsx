import { useColors } from '@/theme/useColor';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  TrendingDown,
  TrendingUp,
  Zap,
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
const CHART_W = width - 40;
const CHART_H = 140;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PERIODS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const CHART_DATA: Record<string, number[]> = {
  '1D': [42100, 42350, 42180, 42900, 43200, 42800, 43500, 43100, 43700, 44100, 43900, 44500],
  '1W': [40000, 40800, 41200, 40600, 42000, 41700, 43100, 42800, 43500, 44100],
  '1M': [38000, 39200, 38500, 40100, 41000, 40200, 42500, 41800, 43000, 43900, 43200, 44500],
  '3M': [32000, 33500, 35000, 34200, 36800, 38000, 37200, 39500, 41000, 42200, 43500, 44500],
  '1Y': [22000, 25000, 23500, 28000, 31000, 29000, 34000, 37000, 36000, 40000, 42000, 44500],
  ALL:  [8000, 12000, 10000, 18000, 22000, 20000, 28000, 35000, 32000, 38000, 42000, 44500],
};

const MOVERS = [
  { ticker: 'NVDA', change: 5.14, vol: '142.3M', price: 891.2 },
  { ticker: 'META', change: 3.78, vol: '89.1M', price: 512.3 },
  { ticker: 'TSLA', change: -2.87, vol: '198.7M', price: 178.4 },
  { ticker: 'AMZN', change: -0.65, vol: '54.2M', price: 183.9 },
];

const HEATMAP = [
  { sector: 'TECH', val: 2.4 },
  { sector: 'HLTH', val: -0.8 },
  { sector: 'FINC', val: 1.1 },
  { sector: 'ENRG', val: -1.9 },
  { sector: 'CONS', val: 0.3 },
  { sector: 'MATL', val: -0.4 },
];

// ─── Line Chart (pure RN) ─────────────────────────────────────────────────────

function LineChart({ data, positive }: { data: number[]; positive: boolean }) {
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [data]);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = data.map((v) => 1 - (v - min) / (max - min));
  const step = CHART_W / (data.length - 1);
  const color = positive ? '#00FF87' : '#FF3B30';

  const minLabel = `$${(min / 1000).toFixed(1)}K`;
  const maxLabel = `$${(max / 1000).toFixed(1)}K`;
  const currentLabel = `$${(data[data.length - 1] / 1000).toFixed(1)}K`;

  return (
    <View style={{ width: CHART_W, height: CHART_H + 30 }}>
      {/* Y labels */}
      <Text style={[styles.chartLabel, { position: 'absolute', top: 0, right: 0 }]}>{maxLabel}</Text>
      <Text style={[styles.chartLabel, { position: 'absolute', bottom: 30, right: 0 }]}>{minLabel}</Text>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <View
          key={v}
          style={{
            position: 'absolute',
            top: v * CHART_H,
            left: 0,
            width: CHART_W - 36,
            height: 1,
            backgroundColor: '#1A1A1A',
          }}
        />
      ))}

      {/* Line segments */}
      {norm.slice(0, -1).map((y, i) => {
        const x1 = i * step;
        const y1 = y * CHART_H;
        const x2 = (i + 1) * step;
        const y2 = norm[i + 1] * CHART_H;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }}
          />
        );
      })}

      {/* Current dot */}
      <View
        style={{
          position: 'absolute',
          left: (data.length - 1) * step - 4,
          top: norm[norm.length - 1] * CHART_H - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#080808',
        }}
      />

      {/* Current callout */}
      <View
        style={{
          position: 'absolute',
          left: (data.length - 1) * step - 36,
          top: norm[norm.length - 1] * CHART_H - 20,
          backgroundColor: color + '20',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        }}
      >
        <Text style={{ color, fontSize: 9, fontFamily: 'Courier', fontWeight: '700' }}>
          {currentLabel}
        </Text>
      </View>
    </View>
  );
}

// ─── Sector Heatmap ───────────────────────────────────────────────────────────

function HeatmapCell({ sector, val }: { sector: string; val: number }) {
  const abs = Math.abs(val);
  const intensity = Math.min(abs / 3, 1);
  const bg = val >= 0
    ? `rgba(0,255,135,${0.06 + intensity * 0.18})`
    : `rgba(255,59,48,${0.06 + intensity * 0.18})`;
  const color = val >= 0 ? '#00FF87' : '#FF3B30';

  return (
    <View style={[styles.heatCell, { backgroundColor: bg, borderColor: color + '30' }]}>
      <Text style={[styles.heatSector, { color }]}>{sector}</Text>
      <Text style={[styles.heatVal, { color }]}>
        {val >= 0 ? '+' : ''}
        {val.toFixed(1)}%
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState('1M');
  const data = CHART_DATA[period];
  const first = data[0];
  const last = data[data.length - 1];
  const change = ((last - first) / first) * 100;
  const isUp = change >= 0;
  const c = useColors();

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.screenLabel}>ANALYTICS</Text>
          <View style={styles.headerRow}>
            <Activity size={14} color="#444" />
            <Text style={styles.headerSub}>Market Overview · NYSE/NASDAQ</Text>
          </View>
        </Animated.View>

        {/* ── Chart Card ── */}
        <View style={styles.card}>
          <View style={styles.chartTopRow}>
            <View>
              <Text style={styles.chartValue}>
                ${(last / 1000).toFixed(2)}K
              </Text>
              <View style={styles.changeRow}>
                {isUp ? (
                  <ArrowUpRight size={12} color="#00FF87" />
                ) : (
                  <ArrowDownRight size={12} color="#FF3B30" />
                )}
                <Text style={[styles.changeText, { color: isUp ? '#00FF87' : '#FF3B30' }]}>
                  {isUp ? '+' : ''}{change.toFixed(2)}% ({period})
                </Text>
              </View>
            </View>
            <Zap size={16} color="#FFD60A" />
          </View>

          <LineChart data={data} positive={isUp} />

          {/* Period Selector */}
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Section Label ── */}
        <View style={styles.sectionRow}>
          <TrendingUp size={11} color="#444" />
          <Text style={styles.sectionLabel}>TOP MOVERS</Text>
        </View>

        {/* ── Movers ── */}
        <View style={styles.moversGrid}>
          {MOVERS.map((m, i) => {
            const up = m.change >= 0;
            return (
              <Animated.View
                key={m.ticker}
                style={[
                  styles.moverCard,
                  {
                    borderColor: up ? '#00FF8720' : '#FF3B3020',
                    backgroundColor: up ? '#00FF870A' : '#FF3B300A',
                  },
                ]}
              >
                <View style={styles.moverTop}>
                  <Text style={[styles.moverTicker, { color: up ? '#00FF87' : '#FF3B30' }]}>
                    {m.ticker}
                  </Text>
                  {up ? (
                    <TrendingUp size={12} color="#00FF87" />
                  ) : (
                    <TrendingDown size={12} color="#FF3B30" />
                  )}
                </View>
                <Text style={styles.moverPrice}>${m.price.toFixed(2)}</Text>
                <Text style={[styles.moverChange, { color: up ? '#00FF87' : '#FF3B30' }]}>
                  {up ? '+' : ''}{m.change.toFixed(2)}%
                </Text>
                <Text style={styles.moverVol}>VOL {m.vol}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* ── Sector Heatmap ── */}
        <View style={styles.sectionRow}>
          <BarChart2 size={11} color="#444" />
          <Text style={styles.sectionLabel}>SECTOR HEAT</Text>
        </View>

        <View style={styles.heatGrid}>
          {HEATMAP.map((h) => (
            <HeatmapCell key={h.sector} sector={h.sector} val={h.val} />
          ))}
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'VIX', value: '18.42', note: 'FEAR INDEX' },
            { label: 'P/E', value: '24.1x', note: 'S&P 500' },
            { label: '10Y', value: '4.28%', note: 'TREASURY' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statNote}>{s.note}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { paddingTop: 20, paddingBottom: 16 },
  screenLabel: { color: '#444', fontSize: 10, letterSpacing: 3, fontFamily: 'Courier', marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerSub: { color: '#333', fontSize: 11, fontFamily: 'Courier' },

  card: {
    backgroundColor: '#0D0D0D',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#141414',
    marginBottom: 24,
  },
  chartTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartValue: { color: '#F5F5F5', fontSize: 28, fontWeight: '700', fontFamily: 'Courier', letterSpacing: -0.5 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  changeText: { fontSize: 11, fontFamily: 'Courier', fontWeight: '600' },
  chartLabel: { color: '#333', fontSize: 9, fontFamily: 'Courier', width: 36, textAlign: 'right' },

  periodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  periodBtnActive: { backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' },
  periodText: { color: '#444', fontSize: 11, fontFamily: 'Courier' },
  periodTextActive: { color: '#F5F5F5' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },

  moversGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  moverCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  moverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moverTicker: { fontSize: 13, fontWeight: '800', fontFamily: 'Courier' },
  moverPrice: { color: '#D0D0D0', fontSize: 16, fontWeight: '700', fontFamily: 'Courier' },
  moverChange: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier' },
  moverVol: { color: '#333', fontSize: 9, fontFamily: 'Courier', marginTop: 2 },

  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  heatCell: {
    width: (width - 56) / 3,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  heatSector: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'Courier', fontWeight: '700' },
  heatVal: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier' },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#141414',
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: { color: '#444', fontSize: 9, letterSpacing: 2, fontFamily: 'Courier' },
  statValue: { color: '#F5F5F5', fontSize: 16, fontWeight: '700', fontFamily: 'Courier' },
  statNote: { color: '#333', fontSize: 8, fontFamily: 'Courier', letterSpacing: 1 },
});