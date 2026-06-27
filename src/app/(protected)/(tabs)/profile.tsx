import { useBiometricAuth } from '@/hooks/useBiometricAuth';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { storage } from '../../../lib/storage';
import { logout } from '../../../store/slices/authSlice';
import { clearBankAccountStorage } from '../../../store/useBankAccountStore';
import { clearWalletStorage } from '../../../store/useWalletStore';

const { width } = Dimensions.get('window');

// ─── KYC Status ───────────────────────────────────────────────────────────────
// In production, pull this from your Redux store or API
// e.g. useSelector((s) => s.auth.user?.kycStatus)

interface KYCStatus {
  bvn: 'verified' | 'pending' | 'failed' | 'none';
  id: 'verified' | 'pending' | 'failed' | 'none';
  selfie: 'verified' | 'pending' | 'failed' | 'none';
  address: 'verified' | 'pending' | 'failed' | 'none';
}

// Mock — replace with real data from store/API
const MOCK_KYC: KYCStatus = {
  bvn: 'verified',
  id: 'none',
  selfie: 'none',
  address: 'none',
};

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

// ─── KYC Status Card ──────────────────────────────────────────────────────────

const KYC_STEPS: {
  key: keyof KYCStatus;
  label: string;
  sub: string;
  route: string;
}[] = [
    { key: 'bvn', label: 'BVN verification', sub: 'Bank Verification Number', route: '/(protected)/settings/kyc/bvn' },
    { key: 'id', label: 'Government ID', sub: 'NIN, Passport, Driver lic.', route: '/(auth)/id-upload' },
    { key: 'selfie', label: 'Selfie check', sub: 'Liveness detection', route: '/(protected)/settings/kyc/selfie' },
    { key: 'address', label: 'Address proof', sub: 'Utility bill or bank stmt.', route: '/(protected)/settings/kyc/address' },
  ];

function kycColor(status: KYCStatus[keyof KYCStatus]) {
  if (status === 'verified') return '#22C55E';
  if (status === 'pending') return '#F59E0B';
  if (status === 'failed') return '#EF4444';
  return '#AAAAAA';
}

function kycBg(status: KYCStatus[keyof KYCStatus]) {
  if (status === 'verified') return '#E8F5E9';
  if (status === 'pending') return '#FFFBEB';
  if (status === 'failed') return '#FFF5F5';
  return '#F5F5F5';
}

function kycLabel(status: KYCStatus[keyof KYCStatus]) {
  if (status === 'verified') return 'Verified';
  if (status === 'pending') return 'Pending';
  if (status === 'failed') return 'Failed';
  return 'Not done';
}

function KYCStepIcon({ status }: { status: KYCStatus[keyof KYCStatus] }) {
  const color = kycColor(status);
  if (status === 'verified') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} fill={color} />
        <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </Svg>
    );
  }
  if (status === 'pending') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} fill={color} />
        <Path d="M12 7v5l3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
    );
  }
  if (status === 'failed') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} fill={color} />
        <Path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </Svg>
    );
  }
  // none
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

function KYCCard({ kyc }: { kyc: KYCStatus }) {
  const router = useRouter();

  const totalVerified = Object.values(kyc).filter(v => v === 'verified').length;
  const allVerified = totalVerified === 4;
  const hasFailed = Object.values(kyc).some(v => v === 'failed');

  // Overall banner color
  const bannerColor = allVerified ? '#22C55E' : hasFailed ? '#EF4444' : '#F59E0B';
  const bannerBg = allVerified ? '#E8F5E9' : hasFailed ? '#FFF5F5' : '#FFFBEB';
  const bannerBorder = allVerified ? '#A5D6A7' : hasFailed ? '#FECACA' : '#FDE68A';
  const bannerLabel = allVerified
    ? 'Identity fully verified'
    : hasFailed
      ? 'Action required'
      : `${totalVerified} of 4 steps complete`;

  return (
    <View style={kycStyles.card}>
      {/* Banner */}
      <View style={[kycStyles.banner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
        <View style={kycStyles.bannerLeft}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
              stroke={bannerColor} strokeWidth={1.8} fill="none"
            />
            {allVerified && (
              <Path d="M9 12l2 2 4-4" stroke={bannerColor} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            )}
          </Svg>
          <View>
            <Text style={[kycStyles.bannerTitle, { color: bannerColor }]}>
              {bannerLabel}
            </Text>
            <Text style={kycStyles.bannerSub}>
              {allVerified
                ? 'You can trade US & NGX stocks'
                : 'Complete verification to unlock all features'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={kycStyles.progressTrack}>
          <View style={[kycStyles.progressFill, {
            width: `${(totalVerified / 4) * 100}%` as any,
            backgroundColor: bannerColor,
          }]} />
        </View>
        <Text style={[kycStyles.progressTxt, { color: bannerColor }]}>
          {totalVerified}/4 complete
        </Text>
      </View>

      {/* Steps */}
      {KYC_STEPS.map((step, i) => {
        const status = kyc[step.key];
        const isLast = i === KYC_STEPS.length - 1;
        const canTap = status !== 'verified';

        return (
          <TouchableOpacity
            key={step.key}
            style={[kycStyles.stepRow, !isLast && kycStyles.stepRowBorder]}
            activeOpacity={canTap ? 0.7 : 1}
            onPress={() => canTap && router.push(step.route as any)}
          >
            {/* Step connector line */}
            {i < KYC_STEPS.length - 1 && (
              <View style={[
                kycStyles.connector,
                kyc[KYC_STEPS[i + 1].key] !== 'none' && { backgroundColor: '#22C55E' },
              ]} />
            )}

            {/* Status icon */}
            <View style={[kycStyles.stepIconWrap, { backgroundColor: kycBg(status) }]}>
              <KYCStepIcon status={status} />
            </View>

            <View style={kycStyles.stepInfo}>
              <Text style={kycStyles.stepLabel}>{step.label}</Text>
              <Text style={kycStyles.stepSub}>{step.sub}</Text>
            </View>

            {/* Badge */}
            <View style={[kycStyles.statusBadge, { backgroundColor: kycBg(status) }]}>
              <Text style={[kycStyles.statusBadgeTxt, { color: kycColor(status) }]}>
                {kycLabel(status)}
              </Text>
            </View>

            {canTap && (
              <ChevronRight size={12} color="#CCCCCC" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const kycStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    marginBottom: 28,
  },
  banner: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
    letterSpacing: 0.3,
  },
  bannerSub: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'Courier',
    marginTop: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressTxt: {
    fontSize: 9,
    fontFamily: 'Courier',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    position: 'relative',
  },
  stepRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
  },
  connector: {
    position: 'absolute',
    left: 27,
    bottom: -14,
    width: 1.5,
    height: 14,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  stepIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepInfo: { flex: 1 },
  stepLabel: {
    color: '#253357',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  stepSub: {
    color: '#888',
    fontSize: 9,
    fontFamily: 'Courier',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
});

// ─── Sign-Out Modal ───────────────────────────────────────────────────────────

function SignOutModal({
  visible, onConfirm, onCancel, signingOut,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  signingOut: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 72, friction: 12, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 320, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onCancel} />
      <Animated.View style={[modalStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={modalStyles.handle} />
        <View style={modalStyles.iconWrap}>
          <LogOut size={28} color="#FF3B30" />
        </View>
        <Text style={modalStyles.title}>Sign out of PulseX?</Text>
        <Text style={modalStyles.sub}>
          Your portfolio data and preferences will be saved. You can sign back in anytime.
        </Text>
        <View style={modalStyles.accountChip}>
          <View style={modalStyles.accountAvatar}>
            <Text style={modalStyles.accountAvatarTxt}>JI</Text>
          </View>
          <View style={modalStyles.accountInfo}>
            <Text style={modalStyles.accountName}>Joseph Israel</Text>
            <Text style={modalStyles.accountEmail}>joseph@pulsex.io</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[modalStyles.signOutBtn, signingOut && { opacity: 0.6 }]}
          onPress={onConfirm} disabled={signingOut} activeOpacity={0.82}
        >
          <Text style={modalStyles.signOutTxt}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={modalStyles.cancelBtn} onPress={onCancel} disabled={signingOut} activeOpacity={0.75}
        >
          <Text style={modalStyles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderRadius: 28,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    alignItems: 'center',
  },
  handle: { width: 32, height: 3, borderRadius: 2, backgroundColor: '#E0E0E0', marginTop: 10, marginBottom: 22 },
  iconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: '#FF3B3010', borderWidth: 1, borderColor: '#FF3B3020',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 13, color: '#AAAAAA', textAlign: 'center', lineHeight: 20, marginBottom: 22, paddingHorizontal: 8 },
  accountChip: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 22 },
  accountAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0F2419', alignItems: 'center', justifyContent: 'center' },
  accountAvatarTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  accountEmail: { fontSize: 12, color: '#AAAAAA', marginTop: 1 },
  signOutBtn: { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  signOutTxt: { fontSize: 15, fontWeight: '800', color: '#DC2626' },
  cancelBtn: { width: '100%', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8E8E8' },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: '#555' },
});

// ─── Stat Badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, index }: { label: string; value: string; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 80, tension: 120, friction: 10, useNativeDriver: true }).start();
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
  icon: Icon,
  label,
  sub,
  hasToggle = false,
  danger,
  onPress,
  value,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  hasToggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
  value?: boolean;
  onToggle?: (value: boolean) => void;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  // const handlePress = () => {
  //   Animated.sequence([
  //     Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
  //     Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
  //   ]).start();
  //   if (hasToggle) {
  //     onToggle?.();
  //   } else {
  //     onPress?.();
  //   }
  // };
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true
      }),
    ]).start();

    if (!hasToggle) {
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
        {hasToggle ? (
          <Switch
            value={value ?? false}
            onValueChange={onToggle}
            trackColor={{
              false: '#1E1E1E',
              true: '#00FF8760'
            }}
            thumbColor={
              value ? '#00FF87' : '#555'
            }
            ios_backgroundColor="#1E1E1E"
            style={{
              transform: [{ scale: 0.8 }]
            }}
          />
        ) : (
          <ChevronRight
            size={14}
            color={danger ? '#FF3B30' : '#333'}
          />
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
        borderColor: isBuy ? '#00FF8730' : '#FF3B3030',
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const c = useColors();
  const { isDark, toggle } = useThemeStore();
  const {
    isEnabled,
    enableBiometric,
    disableBiometric
  } = useBiometricAuth();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // ── In production: pull from Redux store ──────────────────────────
  // const kycStatus = useSelector((s: RootState) => s.auth.user?.kycStatus) ?? MOCK_KYC;
  const kycStatus = MOCK_KYC;
  // ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      dispatch(logout());
      await storage.delete('accessToken');
      await clearBankAccountStorage();
      await clearWalletStorage();
      await new Promise(r => setTimeout(r, 600));
      setShowSignOut(false);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Sign-out error:', e);
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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

        {/* ── KYC Verification Status ── */}
        <View style={styles.sectionRow}>
          <Shield size={11} color="#444" />
          <Text style={styles.sectionLabel}>IDENTITY VERIFICATION</Text>
        </View>
        <KYCCard kyc={kycStatus} />

        {/* ── Recent Activity ── */}
        <View style={styles.sectionRow}>
          <Clock size={11} color="#444" />
          <TouchableOpacity onPress={() => router.push('/(protected)/orderhistory')}>
            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          </TouchableOpacity>
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
          <SettingRow icon={Bell} label="Price Alerts" sub="Get notified on moves" hasToggle />
          <View style={styles.settingDivider} />
          <SettingRow icon={Moon} label="Dark Mode" sub={isDark ? 'Always on' : 'Off'} value={isDark} hasToggle onToggle={toggle} />
          <View style={styles.settingDivider} />
          <SettingRow icon={Eye} label="Hide Balances" sub="Privacy mode" hasToggle />
        </View>

        {/* ── Security ── */}
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <Lock size={11} color="#444" />
          <Text style={styles.sectionLabel}>SECURITY</Text>
        </View>
        <View style={styles.settingsGroup}>
          <SettingRow
            icon={Fingerprint}
            label="Biometric Auth"
            sub={isEnabled ? 'Enabled' : 'Disabled'}
            hasToggle
            value={isEnabled}
            onToggle={async (enabled) => {
              if (enabled) {
                await enableBiometric();
              } else {
                await disableBiometric();
              }
            }}
          />
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
          <SettingRow icon={LogOut} label="Sign Out" danger onPress={() => setShowSignOut(true)} />
        </View>

        <Text style={styles.versionText}>PULSEX v1.0.0 · BUILD 20250609</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

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
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 16 },
  screenLabel: { color: '#444', fontSize: 10, letterSpacing: 3, fontFamily: 'Courier' },
  avatarCard: {
    backgroundColor: '#FAFAFA', borderRadius: 16, borderWidth: 1, borderColor: '#E8E8E8',
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20, overflow: 'hidden',
  },
  avatarGlow: { position: 'absolute', left: -20, top: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: '#00FF8708' },
  avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: '#00FF8740', justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center' },
  avatarInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#253357', fontSize: 18, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFD60A15', borderWidth: 1, borderColor: '#FFD60A30', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  proText: { color: '#FFD60A', fontSize: 8, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  userEmail: { color: '#444', fontSize: 11, fontFamily: 'Courier' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineText: { color: '#00FF87', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  statBadge: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8', padding: 12, alignItems: 'center', gap: 4 },
  statValue: { color: '#253357', fontSize: 14, fontWeight: '800', fontFamily: 'Courier' },
  statLabel: { color: '#444', fontSize: 8, letterSpacing: 1.5, fontFamily: 'Courier' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'Courier' },
  activityList: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden', marginBottom: 28 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  actionTag: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  actionText: { fontSize: 9, fontWeight: '800', fontFamily: 'Courier', letterSpacing: 1 },
  activityMeta: { flex: 1, gap: 2 },
  activityTicker: { color: '#253357', fontSize: 12, fontWeight: '700', fontFamily: 'Courier' },
  activityDetail: { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  activityRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  activityTime: { color: '#333', fontSize: 9, fontFamily: 'Courier' },
  settingsGroup: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden', marginBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  settingIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center' },
  settingIconDanger: { backgroundColor: '#FF3B300F' },
  settingText: { flex: 1, gap: 2 },
  settingLabel: { color: '#253357', fontSize: 12, fontFamily: 'Courier', fontWeight: '600' },
  settingSub: { color: '#444', fontSize: 10, fontFamily: 'Courier' },
  settingDivider: { height: 1, backgroundColor: '#E8E8E8', marginLeft: 56 },
  versionText: { color: '#222', fontSize: 9, fontFamily: 'Courier', letterSpacing: 1.5, textAlign: 'center', marginTop: 20 },
});