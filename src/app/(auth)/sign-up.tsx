/**
 * SignUpScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Production-grade sign-up screen for PulseX (stock market app).
 *
 * Fields:
 *  - First name + Last name (side by side)
 *  - Email address (validated)
 *  - Phone number (Nigerian +234 prefix)
 *  - Password (strength meter)
 *  - Confirm password
 *  - Terms & Privacy checkbox
 *  - Marketing opt-in (optional)
 *
 * Social sign-up: Google (SVG) + Apple (SVG)
 * Already have account? Sign in link
 *
 * API INTEGRATION POINTS:
 *  → signUpWithEmail(payload)  — replace TODO in handleSignUp
 *  → signUpWithGoogle()        — replace TODO in handleGoogle
 *  → signUpWithApple()         — replace TODO in handleApple
 *  → checkEmailAvailability(email) — optional debounced check
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
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

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function AppleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.27.06 2.15.73 2.88.78 1.08-.17 2.1-.88 3.26-.83 1.38.07 2.41.62 3.07 1.6-2.79 1.75-2.14 5.55.27 6.7-.5 1.38-1.14 2.74-1.48 4.63zM12.03 7.25c-.13-2.27 1.72-4.16 3.86-4.25.27 2.28-2.06 4.32-3.86 4.25z"
        fill="#000"
      />
    </Svg>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '#E8E8E8' };
  let score = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  if (pw.length >= 12)              score++;
  if (score <= 1) return { score, label: 'Weak',      color: '#EF4444' };
  if (score <= 2) return { score, label: 'Fair',      color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Good',      color: '#3B82F6' };
  return             { score, label: 'Strong',    color: '#22C55E' };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <View style={strengthStyles.wrap}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= score ? color : '#E8E8E8' },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  bars:  { flexDirection: 'row', gap: 5, flex: 1 },
  bar:   { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', width: 46, textAlign: 'right' },
});

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={checkStyles.row} onPress={onToggle} activeOpacity={0.75}>
      <View style={[checkStyles.box, checked && checkStyles.boxChecked]}>
        {checked && (
          <Svg width={10} height={10} viewBox="0 0 24 24">
            <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

const checkStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  box: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  boxChecked: { backgroundColor: '#0F2419', borderColor: '#0F2419' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const router = useRouter();

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [termsOk,    setTermsOk]    = useState(false);
  const [marketing,  setMarketing]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid   = phone.replace(/\D/g, '').length >= 10;
  const pwdMatch     = password === confirm && confirm.length > 0;
  const { score: pwdScore } = getStrength(password);

  const canSubmit =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    emailValid &&
    phoneValid &&
    pwdScore >= 2 &&
    pwdMatch &&
    termsOk &&
    !loading;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      // ── TODO: replace with your auth call ─────────────────────────
      // await signUpWithEmail({
      //   firstName, lastName, email,
      //   phone: `+234${phone.replace(/\D/g, '')}`,
      //   password,
      //   marketingOptIn: marketing,
      // });
      // ──────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1400)); // mock
      router.replace('/(auth)/verify-email');
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // ── TODO: Google OAuth ─────────────────────────────────────────
    // await signUpWithGoogle();
  };

  const handleApple = async () => {
    // ── TODO: Apple Sign-In ────────────────────────────────────────
    // await signUpWithApple();
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create account</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Top ── */}
          <View style={styles.topBlock}>
            <View style={styles.appIcon}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M3 17l4-8 4 4 4-6 4 10"
                  stroke="#4ADE80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <Text style={styles.title}>Join PulseX</Text>
            <Text style={styles.sub}>Start investing in Nigerian and US stocks</Text>
          </View>

          {/* ── Social ── */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} activeOpacity={0.75}>
              <GoogleLogo size={18} />
              <Text style={styles.socialTxt}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={handleApple} activeOpacity={0.75}>
              <AppleLogo size={18} />
              <Text style={styles.socialTxt}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={styles.divRow}>
            <View style={styles.divLine} /><Text style={styles.divTxt}>or sign up with email</Text><View style={styles.divLine} />
          </View>

          {/* ── First + Last name ── */}
          <View style={styles.nameRow}>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLbl}>FIRST NAME</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.fieldInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Joseph"
                  placeholderTextColor="#CCCCCC"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLbl}>LAST NAME</Text>
              <View style={styles.field}>
                <TextInput
                  style={styles.fieldInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Israel"
                  placeholderTextColor="#CCCCCC"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>

          {/* ── Email ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>EMAIL ADDRESS</Text>
            <View style={[styles.field, emailValid && email.length > 0 && styles.fieldValid]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fIcon}>
                <Rect x={2} y={4} width={20} height={16} rx={3} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M2 8l10 6 10-6" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
              </Svg>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="joseph@pulsex.io"
                placeholderTextColor="#CCCCCC"
                returnKeyType="next"
              />
              {emailValid && email.length > 0 && (
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill="#22C55E" />
                  <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
                </Svg>
              )}
            </View>
          </View>

          {/* ── Phone ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>PHONE NUMBER</Text>
            <View style={[styles.field, phoneValid && styles.fieldValid]}>
              <View style={styles.phonePfx}>
                <Text style={styles.phonePfxTxt}>🇳🇬 +234</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={formatPhone}
                keyboardType="number-pad"
                placeholder="0812 345 6789"
                placeholderTextColor="#CCCCCC"
                maxLength={11}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.fieldHint}>Used for 2FA and withdrawal OTPs</Text>
          </View>

          {/* ── Password ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>PASSWORD</Text>
            <View style={styles.field}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fIcon}>
                <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Circle cx={12} cy={16} r={1.5} fill="#AAAAAA" />
              </Svg>
              <TextInput
                style={styles.fieldInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                placeholder="Min 8 characters"
                placeholderTextColor="#CCCCCC"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} activeOpacity={0.7}>
                <Svg width={17} height={17} viewBox="0 0 24 24">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                  <Circle cx={12} cy={12} r={3} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>
            <StrengthBar password={password} />
            {password.length > 0 && (
              <View style={styles.pwdRules}>
                {[
                  { rule: 'At least 8 characters',       ok: password.length >= 8 },
                  { rule: 'One uppercase letter',         ok: /[A-Z]/.test(password) },
                  { rule: 'One number',                   ok: /[0-9]/.test(password) },
                  { rule: 'One special character',        ok: /[^A-Za-z0-9]/.test(password) },
                ].map(({ rule, ok }) => (
                  <View key={rule} style={styles.ruleRow}>
                    <Text style={[styles.ruleDot, { color: ok ? '#22C55E' : '#CCCCCC' }]}>
                      {ok ? '✓' : '·'}
                    </Text>
                    <Text style={[styles.ruleTxt, { color: ok ? '#555' : '#AAAAAA' }]}>{rule}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Confirm Password ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>CONFIRM PASSWORD</Text>
            <View style={[
              styles.field,
              confirm.length > 0 && (pwdMatch ? styles.fieldValid : styles.fieldError),
            ]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fIcon}>
                <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Circle cx={12} cy={16} r={1.5} fill="#AAAAAA" />
              </Svg>
              <TextInput
                style={styles.fieldInput}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConf}
                autoCapitalize="none"
                placeholder="Re-enter password"
                placeholderTextColor="#CCCCCC"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity onPress={() => setShowConf(v => !v)} activeOpacity={0.7}>
                <Svg width={17} height={17} viewBox="0 0 24 24">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                  <Circle cx={12} cy={12} r={3} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>
            {confirm.length > 0 && !pwdMatch && (
              <Text style={styles.errorTxt}>Passwords don't match</Text>
            )}
          </View>

          {/* ── Referral code (optional) ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>REFERRAL CODE <Text style={styles.optional}>(OPTIONAL)</Text></Text>
            <View style={styles.field}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter referral code"
                placeholderTextColor="#CCCCCC"
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Error ── */}
          {error.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxTxt}>{error}</Text>
            </View>
          )}

          {/* ── Checkboxes ── */}
          <View style={styles.checkGroup}>
            <Checkbox checked={termsOk} onToggle={() => setTermsOk(v => !v)}>
              <Text style={styles.checkTxt}>
                I agree to the{' '}
                <Text style={styles.checkLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.checkLink}>Privacy Policy</Text>
              </Text>
            </Checkbox>

            <Checkbox checked={marketing} onToggle={() => setMarketing(v => !v)}>
              <Text style={styles.checkTxt}>
                Send me market updates, stock alerts, and PulseX news
              </Text>
            </Checkbox>
          </View>

          {/* ── BVN notice ── */}
          <View style={styles.bvnNotice}>
            <Text style={styles.bvnTxt}>
              📋  You'll need your BVN to verify your identity after sign-up (required by CBN for investment accounts).
            </Text>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.cta, !canSubmit && styles.ctaDim]}
            disabled={!canSubmit}
            onPress={handleSignUp}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaTxt}>Create account</Text>
            }
          </TouchableOpacity>

          {/* ── Sign in ── */}
          <View style={styles.signinRow}>
            <Text style={styles.signinTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
              <Text style={styles.signinLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0', gap: 12,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  scroll:  { paddingHorizontal: 22, paddingBottom: 40 },
  topBlock: { alignItems: 'center', paddingTop: 24, marginBottom: 22 },
  appIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#0F2419',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.3, marginBottom: 5 },
  sub:   { fontSize: 13, color: '#AAAAAA', textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#fff',
  },
  socialTxt: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  divTxt:  { fontSize: 11, color: '#CCCCCC',  },//whiteSpace: 'nowrap'
  nameRow: { flexDirection: 'row', gap: 10 },
  fieldWrap: { marginBottom: 14 },
  fieldLbl:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 7 },
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12,
    backgroundColor: '#FAFAFA', paddingHorizontal: 13,
    minHeight: 50, gap: 10,
  },
  fieldValid: { borderColor: '#22C55E', backgroundColor: '#F9FFF9' },
  fieldError: { borderColor: '#DC2626' },
  fIcon:      { flexShrink: 0 },
  fieldInput: { flex: 1, fontSize: 14, color: '#0A0A0A', padding: 0 },
  fieldHint:  { fontSize: 11, color: '#BBBBBB', marginTop: 5, marginLeft: 2 },
  phonePfx: {
    flexDirection: 'row', alignItems: 'center', flexShrink: 0, paddingRight: 4,
  },
  phonePfxTxt: { fontSize: 13, fontWeight: '600', color: '#555' },
  phoneDivider: { width: 1, height: 22, backgroundColor: '#E8E8E8', marginRight: 4 },
  optional: { color: '#CCCCCC', fontWeight: '400' },
  pwdRules:  { marginTop: 8, gap: 4 },
  ruleRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleDot:   { fontSize: 13, fontWeight: '700', width: 14 },
  ruleTxt:   { fontSize: 11 },
  errorTxt:  { fontSize: 12, color: '#DC2626', marginTop: 5, marginLeft: 2 },
  errorBox:  {
    backgroundColor: '#FEF2F2', borderRadius: 10,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  errorBoxTxt: { fontSize: 13, color: '#991B1B' },
  checkGroup: { gap: 14, marginBottom: 16 },
  checkTxt:   { fontSize: 13, color: '#555', lineHeight: 19 },
  checkLink:  { color: '#0F2419', fontWeight: '700' },
  bvnNotice: {
    backgroundColor: '#FFF9EC', borderRadius: 10,
    padding: 12, marginBottom: 18, borderWidth: 1, borderColor: '#FDE68A',
  },
  bvnTxt: { fontSize: 12, color: '#78350F', lineHeight: 18 },
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  ctaDim:  { opacity: 0.45 },
  ctaTxt:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  signinRow:  { flexDirection: 'row', justifyContent: 'center' },
  signinTxt:  { fontSize: 13, color: '#AAAAAA' },
  signinLink: { fontSize: 13, fontWeight: '800', color: '#0F2419' },
});