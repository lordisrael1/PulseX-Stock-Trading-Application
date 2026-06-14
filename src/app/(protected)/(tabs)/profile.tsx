import { useColors } from '@/theme/useColor';
import { useThemeStore } from '@/theme/useThemeStore';
import { useRouter } from 'expo-router';
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
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { storage } from '../../../lib/storage';
import { logout } from '../../../store/slices/authSlice';

const { width } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'TRADES',   value: '247'     },
  { label: 'WIN RATE', value: '61.3%'   },
  { label: 'BEST DAY', value: '+$2,841' },
  { label: 'STREAK',   value: '7d'      },
];

const ACTIVITY = [
  { action: 'BUY',  ticker: 'NVDA', qty: 3, price: 872.4, time: '2h ago' },
  { action: 'SELL', ticker: 'TSLA', qty: 2, price: 182.1, time: '1d ago' },
  { action: 'BUY',  ticker: 'META', qty: 1, price: 498.6, time: '2d ago' },
  { action: 'BUY',  ticker: 'AAPL', qty: 5, price: 186.2, time: '3d ago' },
];

// ─── Sign-Out Modal ───────────────────────────────────────────────────────────
// Matches 0000000000.png exactly:
//   - LogOut icon in red tint circle
//   - "Sign out of PulseX?" title
//   - Subtitle text
//   - Account chip (avatar initials + name + email)
//   - Red "Sign out" destructive button
//   - Outline "Cancel" button

function SignOutModal({
  visible,
  onConfirm,
  onCancel,
  signingOut,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  signingOut: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 72,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 320,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* ── Backdrop ── */}
      <TouchableOpacity
        style={modalStyles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      />

      {/* ── Sheet ── */}
      <Animated.View
        style={[
          modalStyles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={modalStyles.handle} />

        {/* Icon */}
        <View style={modalStyles.iconWrap}>
          <LogOut size={28} color="#FF3B30" />
        </View>

        {/* Title */}
        <Text style={modalStyles.title}>Sign out of PulseX?</Text>

        {/* Subtitle */}
        <Text style={modalStyles.sub}>
          Your portfolio data and preferences will be saved. You can sign back in anytime.
        </Text>

        {/* Account chip */}
        <View style={modalStyles.accountChip}>
          <View style={modalStyles.accountAvatar}>
            <Text style={modalStyles.accountAvatarTxt}>JI</Text>
          </View>
          <View style={modalStyles.accountInfo}>
            <Text style={modalStyles.accountName}>Joseph Israel</Text>
            <Text style={modalStyles.accountEmail}>joseph@pulsex.io</Text>
          </View>
        </View>

        {/* Sign out button */}
        <TouchableOpacity
          style={[modalStyles.signOutBtn, signingOut && { opacity: 0.6 }]}
          onPress={onConfirm}
          disabled={signingOut}
          activeOpacity={0.82}
        >
          <Text style={modalStyles.signOutTxt}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Text>
        </TouchableOpacity>

        {/* Cancel button */}
        <TouchableOpacity
          style={modalStyles.cancelBtn}
          onPress={onCancel}
          disabled={signingOut}
          activeOpacity={0.75}
        >
          <Text style={modalStyles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    alignItems: 'center',
  },
  handle: {
    width: 32, height: 3, borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 10, marginBottom: 22,
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: '#FF3B3010',
    borderWidth: 1, borderColor: '#FF3B3020',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18, fontWeight: '800',
    color: '#0A0A0A', letterSpacing: -0.3,
    marginBottom: 8, textAlign: 'center',
  },
  sub: {
    fontSize: 13, color: '#AAAAAA',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 22, paddingHorizontal: 8,
  },
  accountChip: {
    width: '100%', flexDirection: 'row',
    alignItems: 'center', gap: 12,
    backgroundColor: '#F8F8F8', borderRadius: 14,
    padding: 14, marginBottom: 22,
  },
  accountAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0F2419',
    alignItems: 'center', justifyContent: 'center',
  },
  accountAvatarTxt: {
    fontSize: 13, fontWeight: '800', color: '#fff',
  },
  accountInfo: { flex: 1 },
  accountName:  { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  accountEmail: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  signOutBtn: {
    width: '100%', backgroundColor: '#FEF2F2',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  signOutTxt: {
    fontSize: 15, fontWeight: '800', color: '#DC2626',
  },
  cancelBtn: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  cancelTxt: {
    fontSize: 15, fontWeight: '600', color: '#555',
  },
});

// ─── Stat Badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, index }: { label: string; value: string; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay: index * 80,
      tension: 120, friction: 10, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[styles.statBadge, { opacity: anim, transform: [{ scale: anim }] }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({
  icon: Icon, label, sub, toggle, danger, onPress, value, onToggle,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
  value?: boolean;
  onToggle?: () => void;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    if (toggle !== undefined && onToggle) {
      onToggle();
    } else {
      onPress?.();
    }
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <Animated.View style={[styles.settingRow, { transform: [{ scale: pressAnim }] }]}>
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
      <View style={[styles.actionTag, {
        backgroundColor: isBuy ? '#00FF870F' : '#FF3B300F',
        borderColor:     isBuy ? '#00FF8730' : '#FF3B3030',
      }]}>
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
  const router      = useRouter();
  const dispatch    = useAppDispatch();
  const c           = useColors();
  const { isDark, toggle } = useThemeStore();

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Sign-out handler ──────────────────────────────────────────────
  // 1. Clears Redux state (user + token set to null)
  // 2. Deletes token from SecureStore
  // 3. Navigates to login — replaces stack so back button can't return

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Clear Redux auth state
      dispatch(logout());

      // Wipe persisted token from SecureStore
      await storage.delete('accessToken');

      // Brief delay so the user sees the "Signing out…" state
      await new Promise(r => setTimeout(r, 600));

      setShowSignOut(false);

      // Replace entire navigation stack with login
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Sign-out error:', e);
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.screenLabel}>PROFILE</Text>
        </Animated.View>

        {/* ── Avatar Card ── */}
        <Animated.View style={[styles.avatarCard, { transform: [{ scale: avatarScale }] }]}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <UserCircle2 size={36} color="#FFF" />
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

        {/* ── Preferences ── */}
        <View style={styles.sectionRow}>
          <Shield size={11} color="#444" />
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingRow icon={Bell} label="Price Alerts" sub="Get notified on moves" toggle={true} />
          <View style={styles.settingDivider} />
          <SettingRow
            icon={Moon}
            label="Dark Mode"
            sub={isDark ? 'Always on' : 'Off'}
            value={isDark}
            toggle={true}
            onToggle={toggle}
          />
          <View style={styles.settingDivider} />
          <SettingRow icon={Eye} label="Hide Balances" sub="Privacy mode" toggle={false} />
        </View>

        {/* ── Security ── */}
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <Lock size={11} color="#444" />
          <Text style={styles.sectionLabel}>SECURITY</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingRow icon={Fingerprint} label="Biometric Auth"  sub="FaceID / TouchID"       toggle={true} />
          <View style={styles.settingDivider} />
          <SettingRow icon={Shield}      label="Two-Factor Auth" sub="SMS + Authenticator"                   />
          <View style={styles.settingDivider} />
          <SettingRow icon={AlertTriangle} label="Login Activity" sub="3 devices"                            />
        </View>

        {/* ── Danger Zone ── */}
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <AlertTriangle size={11} color="#FF3B30" />
          <Text style={[styles.sectionLabel, { color: '#FF3B3060' }]}>DANGER ZONE</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingRow
            icon={LogOut}
            label="Sign Out"
            danger
            onPress={() => setShowSignOut(true)}   // ← opens modal
          />
        </View>

        {/* ── Version ── */}
        <Text style={styles.versionText}>PULSEX v1.0.0 · BUILD 20250609</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sign-Out Modal ── */}
      <SignOutModal
        visible={showSignOut}
        signingOut={signingOut}
        onConfirm={handleSignOut}
        onCancel={() => { if (!signingOut) setShowSignOut(false); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header:      { paddingTop: 20, paddingBottom: 16 },
  screenLabel: { color: '#444', fontSize: 10, letterSpacing: 3, fontFamily: 'Courier' },

  avatarCard: {
    backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 1, borderColor: '#E8E8E8',
    padding: 20, flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 20, overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute', left: -20, top: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#00FF8708',
  },
  avatarRing: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, borderColor: '#00FF8740',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#D0D0D0',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInfo: { flex: 1, gap: 4 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName:   { color: '#253357', fontSize: 18, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  proBadge:   {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFD60A15', borderWidth: 1, borderColor: '#FFD60A30',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  proText:    { color: '#FFD60A', fontSize: 8, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  userEmail:  { color: '#444', fontSize: 11, fontFamily: 'Courier' },
  onlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineText: { color: '#00FF87', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },

  statsGrid:  { flexDirection: 'row', gap: 8, marginBottom: 28 },
  statBadge:  {
    flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10,
    borderWidth: 1, borderColor: '#E8E8E8',
    padding: 12, alignItems: 'center', gap: 4,
  },
  statValue:  { color: '#253357', fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
  statLabel:  { color: '#444', fontSize: 8, letterSpacing: 1.5, fontFamily: 'Courier' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },

  activityList: {
    backgroundColor: '#FAFAFA', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8',
    overflow: 'hidden', marginBottom: 28,
  },
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  actionTag: {
    borderRadius: 5, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 44, alignItems: 'center',
  },
  actionText:     { fontSize: 9, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  activityMeta:   { flex: 1, gap: 2 },
  activityTicker: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  activityDetail: { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  activityRight:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  activityTime:   { color: '#333', fontSize: 9, fontFamily: 'Courier' },

  settingsGroup: {
    backgroundColor: '#FAFAFA', borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8',
    overflow: 'hidden', marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 12,
  },
  settingIcon:       { width: 30, height: 30, borderRadius: 8, backgroundColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center' },
  settingIconDanger: { backgroundColor: '#FF3B300F' },
  settingText:       { flex: 1, gap: 2 },
  settingLabel:      { color: '#253357', fontSize: 12, fontFamily: 'Courier', fontWeight: '600' },
  settingSub:        { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  settingDivider:    { height: 1, backgroundColor: '#E8E8E8', marginLeft: 56 },

  versionText: {
    color: '#222', fontSize: 9, fontFamily: 'Courier',
    letterSpacing: 1.5, textAlign: 'center', marginTop: 20,
  },
});