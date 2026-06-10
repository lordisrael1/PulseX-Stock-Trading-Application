import { useColors } from '@/theme/useColor';
import { useThemeStore } from '@/theme/useThemeStore';
import {
  AlertTriangle,
  Award,
  Bell,
  ChevronRight,
  Clock,
  Eye,
  Fingerprint,
  Lock,
  LogOut,
  Moon,
  Shield,
  UserCircle2,
  Wifi,
} from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
 
const { width } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────────────
 
const STATS = [
  { label: 'TRADES', value: '247' },
  { label: 'WIN RATE', value: '61.3%' },
  { label: 'BEST DAY', value: '+$2,841' },
  { label: 'STREAK', value: '7d' },
];
 
const ACTIVITY = [
  { action: 'BUY', ticker: 'NVDA', qty: 3, price: 872.4, time: '2h ago' },
  { action: 'SELL', ticker: 'TSLA', qty: 2, price: 182.1, time: '1d ago' },
  { action: 'BUY', ticker: 'META', qty: 1, price: 498.6, time: '2d ago' },
  { action: 'BUY', ticker: 'AAPL', qty: 5, price: 186.2, time: '3d ago' },
];
 
// ─── Stat Badge ────────────────────────────────────────────────────────────────
 
function StatBadge({ label, value, index }: { label: string; value: string; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 80,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);
 
  return (
    <Animated.View
      style={[
        styles.statBadge,
        { opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}
 
// ─── Setting Row ───────────────────────────────────────────────────────────────
 
function SettingRow({
  icon: Icon,
  label,
  sub,
  toggle,
  danger,
  onPress,
  value,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
   value?: boolean;       // ← add
  onToggle?: () => void; 
}) {
  //const [enabled, setEnabled] = useState(toggle !== undefined ? toggle : false);
  const pressAnim = useRef(new Animated.Value(1)).current;
 
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
     if (toggle !== undefined && onToggle) {
    onToggle(); // ← fire toggle on row tap too
  } else {
    onPress?.();
  }
  };
 
  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <Animated.View
        style={[styles.settingRow, { transform: [{ scale: pressAnim }] }]}
      >
        <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
          <Icon size={14} color={danger ? '#FF3B30' : '#888'} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, danger && { color: '#FF3B30' }]}>{label}</Text>
          {sub && <Text style={styles.settingSub}>{sub}</Text>}
        </View>
        {toggle !== undefined ? (
          <Switch
            value={value ?? false}
            onValueChange={onToggle}
            trackColor={{ false: '#1E1E1E', true: '#00FF8760' }}
            thumbColor={value ? '#00FF87' : '#555'}
            ios_backgroundColor="#1E1E1E"
            style={{ transform: [{ scale: 0.8 }] }}
          />
        ) : (
          <ChevronRight size={14} color={danger ? '#FF3B30' : '#333'} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
 
// ─── Activity Item ────────────────────────────────────────────────────────────
 
function ActivityItem({ item, index }: { item: (typeof ACTIVITY)[0]; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }).start();
  }, []);
 
  const isBuy = item.action === 'BUY';
  return (
    <Animated.View style={[styles.activityItem, { opacity: anim }]}>
      <View style={[styles.actionTag, { backgroundColor: isBuy ? '#00FF870F' : '#FF3B300F', borderColor: isBuy ? '#00FF8730' : '#FF3B3030' }]}>
        <Text style={[styles.actionText, { color: isBuy ? '#00FF87' : '#FF3B30' }]}>{item.action}</Text>
      </View>
      <View style={styles.activityMeta}>
        <Text style={styles.activityTicker}>{item.ticker}</Text>
        <Text style={styles.activityDetail}>{item.qty} shares @ ${item.price}</Text>
      </View>
      <View style={styles.activityRight}>
        <Clock size={10} color="#333" />
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}
 
// ─── Main Screen ──────────────────────────────────────────────────────────────
 
export default function ProfileScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const c = useColors();
  const {isDark, toggle} = useThemeStore();
 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);
 
  return (
    <SafeAreaView style ={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
 
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.screenLabel}>PROFILE</Text>
        </Animated.View>
 
        {/* ── Avatar Card ── */}
        <Animated.View style={[styles.avatarCard, { transform: [{ scale: avatarScale }] }]}>
          {/* Ambient glow behind avatar */}
          <View style={styles.avatarGlow} />
 
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <UserCircle2 size={36} color="#888" />
            </View>
          </View>
 
          <View style={styles.avatarInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>ISRAEL J.</Text>
              <View style={styles.proBadge}>
                <Award size={9} color="#FFD60A" />
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>israel@domain.com</Text>
            <View style={styles.onlineRow}>
              <Wifi size={9} color="#00FF87" />
              <Text style={styles.onlineText}>LIVE · NYSE/NASDAQ</Text>
            </View>
          </View>
        </Animated.View>
 
        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <StatBadge key={s.label} label={s.label} value={s.value} index={i} />
          ))}
        </View>
 
        {/* ── Recent Activity ── */}
        <View style={styles.sectionRow}>
          <Clock size={11} color="#444" />
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        </View>
 
        <View style={styles.activityList}>
          {ACTIVITY.map((item, i) => (
            <ActivityItem key={i} item={item} index={i} />
          ))}
        </View>
 
        {/* ── Settings ── */}
        <View style={styles.sectionRow}>
          <Shield size={11} color="#444" />
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
        </View>
 
        <View style={styles.settingsGroup}>
          <SettingRow icon={Bell} label="Price Alerts" sub="Get notified on moves" toggle={true} />
          <View style={styles.settingDivider} />
          <SettingRow icon={Moon} label="Dark Mode" sub={isDark ? "Always on" : "Off"} value={isDark} toggle={true} onToggle={toggle} />
          <View style={styles.settingDivider} />
          <SettingRow icon={Eye} label="Hide Balances" sub="Privacy mode" toggle={false} />
        </View>
 
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <Lock size={11} color="#444" />
          <Text style={styles.sectionLabel}>SECURITY</Text>
        </View>
 
        <View style={styles.settingsGroup}>
          <SettingRow icon={Fingerprint} label="Biometric Auth" sub="FaceID / TouchID" toggle={true} />
          <View style={styles.settingDivider} />
          <SettingRow icon={Shield} label="Two-Factor Auth" sub="SMS + Authenticator" />
          <View style={styles.settingDivider} />
          <SettingRow icon={AlertTriangle} label="Login Activity" sub="3 devices" />
        </View>
 
        {/* ── Danger Zone ── */}
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <AlertTriangle size={11} color="#FF3B30" />
          <Text style={[styles.sectionLabel, { color: '#FF3B3060' }]}>DANGER ZONE</Text>
        </View>
 
        <View style={styles.settingsGroup}>
          <SettingRow icon={LogOut} label="Sign Out" danger />
        </View>
 
        {/* ── Version ── */}
        <Text style={styles.versionText}>STOCKR v2.4.1 · BUILD 20240531</Text>
 
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
  screenLabel: { color: '#444', fontSize: 10, letterSpacing: 3, fontFamily: 'Courier' },
 
  avatarCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#141414',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00FF8708',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#00FF8740',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#F5F5F5', fontSize: 18, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFD60A15',
    borderWidth: 1,
    borderColor: '#FFD60A30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proText: { color: '#FFD60A', fontSize: 8, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  userEmail: { color: '#444', fontSize: 11, fontFamily: 'Courier' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineText: { color: '#00FF87', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },
 
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  statBadge: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#141414',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: '#F5F5F5', fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
  statLabel: { color: '#444', fontSize: 8, letterSpacing: 1.5, fontFamily: 'Courier' },
 
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },
 
  activityList: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#141414',
    overflow: 'hidden',
    marginBottom: 28,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
    gap: 12,
  },
  actionTag: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  actionText: { fontSize: 9, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  activityMeta: { flex: 1, gap: 2 },
  activityTicker: { color: '#D0D0D0', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  activityDetail: { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  activityRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  activityTime: { color: '#333', fontSize: 9, fontFamily: 'Courier' },
 
  settingsGroup: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#141414',
    overflow: 'hidden',
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconDanger: { backgroundColor: '#FF3B300F' },
  settingText: { flex: 1, gap: 2 },
  settingLabel: { color: '#D0D0D0', fontSize: 12, fontFamily: 'Courier', fontWeight: '600' },
  settingSub: { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  settingDivider: { height: 1, backgroundColor: '#111', marginLeft: 56 },
 
  versionText: {
    color: '#222',
    fontSize: 9,
    fontFamily: 'Courier',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 20,
  },
});