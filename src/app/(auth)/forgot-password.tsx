/**
 * ForgotPasswordScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Matches 09090909.png:
 *  - Back arrow + "Forgot password" header
 *  - Lock icon illustration
 *  - "Reset your password" title + description
 *  - EMAIL ADDRESS field
 *  - "Send reset link" CTA
 *  - "Reset via phone instead" card with masked number
 *  - "Back to sign in" ghost link
 *  - SUCCESS MODAL: slides up when link is sent, "Okay" navigates back
 *
 * API INTEGRATION POINTS:
 *  → sendPasswordResetEmail(email)   — replace TODO in handleSend
 *  → sendOtpToPhone(maskedPhone)     — replace TODO in handlePhoneReset
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({
  visible,
  email,
  onOkay,
}: {
  visible: boolean;
  email: string;
  onOkay: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0, tension: 80, friction: 12, useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 80, friction: 12, useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      scaleAnim.setValue(0.85);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={modalStyles.backdrop}>
        <Animated.View
          style={[
            modalStyles.sheet,
            { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={modalStyles.iconWrap}>
            <Svg width={32} height={32} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={10} fill="#E4F2EC" />
              <Path
                d="M8 12l3 3 5-5"
                stroke="#166534"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>

          <Text style={modalStyles.title}>Reset link sent!</Text>
          <Text style={modalStyles.sub}>
            We've sent a password reset link to{'\n'}
            <Text style={modalStyles.email}>{email}</Text>
            {'\n\n'}Check your inbox (and spam folder). The link expires in 15 minutes.
          </Text>

          {/* Tips */}
          <View style={modalStyles.tipsBox}>
            <Text style={modalStyles.tipRow}>📬  Check your spam / junk folder</Text>
            <Text style={modalStyles.tipRow}>⏱  Link expires in 15 minutes</Text>
            <Text style={modalStyles.tipRow}>🔄  Didn't get it? Tap resend below</Text>
          </View>

          <TouchableOpacity style={modalStyles.okBtn} onPress={onOkay} activeOpacity={0.85}>
            <Text style={modalStyles.okTxt}>Okay, got it</Text>
          </TouchableOpacity>

          <TouchableOpacity style={modalStyles.resendBtn} activeOpacity={0.7}>
            <Text style={modalStyles.resendTxt}>Resend email</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend    = emailValid && !loading;

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setError('');
    try {
      // ── TODO: replace with your auth call ─────────────────────────
      // await sendPasswordResetEmail(email);
      // ──────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200)); // mock
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneReset = async () => {
    // ── TODO: replace with your OTP trigger ───────────────────────
    // await sendOtpToPhone(maskedPhone);
    // router.push('/(auth)/otp-verify');
    // ─────────────────────────────────────────────────────────────
  };

  const handleOkay = () => {
    setSuccess(false);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot password</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Illustration ── */}
          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationIcon}>
              <Svg width={38} height={38} viewBox="0 0 24 24">
                <Rect x={3} y={11} width={18} height={11} rx={2}
                  stroke="#888" strokeWidth={1.8} fill="none" />
                <Path d="M7 11V7a5 5 0 0 1 9.9-1"
                  stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                <Circle cx={12} cy={16} r={1.5} fill="#888" />
              </Svg>
            </View>
          </View>

          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.sub}>
            Enter your email and we'll send a reset link.{'\n'}Check spam if you don't see it.
          </Text>

          {/* ── Email field ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>EMAIL ADDRESS</Text>
            <View style={[
              styles.field,
              error.length > 0 && styles.fieldError,
              emailValid && email.length > 0 && styles.fieldValid,
            ]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fieldIcon}>
                <Rect x={2} y={4} width={20} height={16} rx={3}
                  stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M2 8l10 6 10-6"
                  stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
              </Svg>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="Enter your email"
                placeholderTextColor="#CCCCCC"
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
            </View>
            {error.length > 0 && (
              <Text style={styles.errorTxt}>{error}</Text>
            )}
          </View>

          {/* ── Send CTA ── */}
          <TouchableOpacity
            style={[styles.cta, !canSend && styles.ctaDim]}
            disabled={!canSend}
            onPress={handleSend}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaTxt}>Send reset link</Text>
            }
          </TouchableOpacity>

          {/* ── Reset via phone ── */}
          <TouchableOpacity
            style={styles.phoneCard}
            onPress={handlePhoneReset}
            activeOpacity={0.75}
          >
            <View style={styles.phoneIconWrap}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Rect x={5} y={2} width={14} height={20} rx={3}
                  stroke="#166534" strokeWidth={1.8} fill="none" />
                <Circle cx={12} cy={18} r={1} fill="#166534" />
              </Svg>
            </View>
            <View style={styles.phoneInfo}>
              <Text style={styles.phoneTitle}>Reset via phone instead</Text>
              <Text style={styles.phoneSub}>
                We'll send an OTP to +234 *** ****9 900
              </Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M9 18l6-6-6-6"
                stroke="#CCCCCC" strokeWidth={2} strokeLinecap="round" fill="none" />
            </Svg>
          </TouchableOpacity>

          {/* ── Back to sign in ── */}
          <TouchableOpacity
            style={styles.backLinkRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backLink}>Back to sign in</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Success Modal ── */}
      <SuccessModal
        visible={success}
        email={email}
        onOkay={handleOkay}
      />
    </SafeAreaView>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#E4F2EC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title:  { fontSize: 20, fontWeight: '900', color: '#0A0A0A', marginBottom: 10, letterSpacing: -0.3 },
  sub:    { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  email:  { fontWeight: '800', color: '#0A0A0A' },
  tipsBox: {
    width: '100%', backgroundColor: '#F8F8F8',
    borderRadius: 12, padding: 14, marginBottom: 20, gap: 8,
  },
  tipRow: { fontSize: 12, color: '#555', lineHeight: 20 },
  okBtn: {
    width: '100%', backgroundColor: '#0F2419',
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginBottom: 10,
  },
  okTxt:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  resendBtn: { paddingVertical: 10 },
  resendTxt: { fontSize: 13, color: '#AAAAAA', fontWeight: '600' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0', gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  illustrationWrap: { alignItems: 'center', paddingTop: 32, paddingBottom: 20 },
  illustrationIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#0A0A0A',
    textAlign: 'center', letterSpacing: -0.3, marginBottom: 10,
  },
  sub: {
    fontSize: 13, color: '#AAAAAA', textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },
  fieldWrap: { marginBottom: 16 },
  fieldLbl:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 7 },
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12,
    backgroundColor: '#FAFAFA', paddingHorizontal: 13,
    minHeight: 50, gap: 10,
  },
  fieldValid: { borderColor: '#22C55E' },
  fieldError: { borderColor: '#DC2626' },
  fieldIcon:  { flexShrink: 0 },
  fieldInput: { flex: 1, fontSize: 14, color: '#0A0A0A', padding: 0 },
  errorTxt:   { fontSize: 12, color: '#DC2626', marginTop: 5, marginLeft: 2 },
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 14,
  },
  ctaDim: { opacity: 0.45 },
  ctaTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  phoneCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14,
    padding: 14, gap: 12, marginBottom: 20,
  },
  phoneIconWrap: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: '#E4F2EC',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  phoneInfo:  { flex: 1 },
  phoneTitle: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  phoneSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  backLinkRow: { alignItems: 'center' },
  backLink:    { fontSize: 13, color: '#AAAAAA', fontWeight: '600' },
});