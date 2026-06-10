// import { router } from "expo-router";
// import { useState } from "react";
// import {
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { useAppDispatch } from "../../hooks/useAppDispatch";
// import { storage } from "../../lib/storage";
// import { setCredentials } from "../../store/slices/authSlice";

// export default function LoginScreen() {
//     const dispatch = useAppDispatch();

//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");

//     const handleLogin = async () => {
//         try {
//             // API call
//             const response = {
//                 token: "abc123",
//                 user: {
//                     id: "1",
//                     email,
//                     fullName: "Israel Joseph",
//                 },
//             };

//             await storage.set(
//                 "accessToken",
//                 response.token
//             );

//             dispatch(
//                 setCredentials({
//                     user: response.user,
//                     token: response.token,
//                 })
//             );

//             router.replace("/");
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Login</Text>

//             <TextInput
//                 placeholder="Email"
//                 value={email}
//                 onChangeText={setEmail}
//                 style={styles.input}
//             />

//             <TextInput
//                 placeholder="Password"
//                 secureTextEntry
//                 value={password}
//                 onChangeText={setPassword}
//                 style={styles.input}
//             />

//             <TouchableOpacity style={styles.button} onPress={handleLogin}>
//                 <Text style={styles.buttonText}>Login</Text>
//             </TouchableOpacity>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: "center",
//         padding: 20,
//     },
//     title: {
//         fontSize: 30,
//         fontWeight: "bold",
//         marginBottom: 20,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: "#ddd",
//         padding: 12,
//         marginBottom: 12,
//         borderRadius: 8,
//     },
//     button: {
//         backgroundColor: "#2563eb",
//         padding: 15,
//         borderRadius: 8,
//     },
//     buttonText: {
//         color: "#fff",
//         textAlign: "center",
//         fontWeight: "bold",
//     },
// });


/**
 * LoginScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Matches 12121.png:
 *  - Dark green app icon with trending-up arrow
 *  - "Welcome back" + subtitle
 *  - Email field (pre-seeded) with green checkmark
 *  - Password field with eye toggle
 *  - "Forgot password?" right-aligned
 *  - "Sign in" dark CTA
 *  - "or continue with" divider
 *  - Google (SVG G logo) + Apple (SVG Apple logo) social buttons
 *  - "Don't have an account? Sign up"
 *  - Biometrics hint at bottom
 *
 * API INTEGRATION POINTS:
 *  → signInWithEmail(email, password)  — replace TODO block in handleSignIn
 *  → signInWithGoogle()                — replace TODO in handleGoogle
 *  → signInWithApple()                 — replace TODO in handleApple
 *  → signInWithBiometrics()            — replace TODO in handleBio
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { storage } from "../../lib/storage";
import { setCredentials } from "../../store/slices/authSlice";

// ─── SVG Brand Logos ─────────────────────────────────────────────────────────

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleLogo({ size = 18, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.27.06 2.15.73 2.88.78 1.08-.17 2.1-.88 3.26-.83 1.38.07 2.41.62 3.07 1.6-2.79 1.75-2.14 5.55.27 6.7-.5 1.38-1.14 2.74-1.48 4.63zM12.03 7.25c-.13-2.27 1.72-4.16 3.86-4.25.27 2.28-2.06 4.32-3.86 4.25z"
        fill={color}
      />
    </Svg>
  );
}

function AppIcon() {
  return (
    <View style={styles.appIconWrap}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path
          d="M3 17l4-8 4 4 4-6 4 10"
          stroke="#4ADE80"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Pre-seeded for dev — clear in production
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const pwdRef = useRef<TextInput>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = emailValid && password.length >= 6 && !loading;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      // ── TODO: replace with your auth call ─────────────────────────
      // await signInWithEmail(email, password);
      // ─────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200)); // mock
      const response = {
                token: "abc123",
                user: {
                    id: "1",
                    email,
                    password,
                    fullName: "Israel Joseph",
                },
            };
      await storage.set(
                "accessToken",
                response.token
            );

            dispatch(
                setCredentials({
                    user: response.user,
                    token: response.token,
                })
            );
      router.replace('/(protected)/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    // ── TODO: replace with your Google OAuth call ──────────────────
    // await signInWithGoogle();
    // ──────────────────────────────────────────────────────────────
  };

  const handleApple = async () => {
    // ── TODO: replace with your Apple Sign-In call ─────────────────
    // await signInWithApple();
    // ──────────────────────────────────────────────────────────────
  };

  const handleBio = async () => {
    // ── TODO: replace with expo-local-authentication ───────────────
    // const result = await LocalAuthentication.authenticateAsync();
    // if (result.success) router.replace('/(protected)/(tabs)');
    // ──────────────────────────────────────────────────────────────
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── App icon + title ── */}
          <View style={styles.top}>
            <AppIcon />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to your PulseX account</Text>
          </View>

          {/* ── Email ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>EMAIL</Text>
            <View style={[styles.field, emailValid && email.length > 0 && styles.fieldValid]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fieldIcon}>
                <Rect x={2} y={4} width={20} height={16} rx={3} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M2 8l10 6 10-6" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
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
                returnKeyType="next"
                onSubmitEditing={() => pwdRef.current?.focus()}
              />
              {emailValid && email.length > 0 && (
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill="#22C55E" />
                  <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              )}
            </View>
          </View>

          {/* ── Password ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>PASSWORD</Text>
            <View style={styles.field}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.fieldIcon}>
                <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                <Circle cx={12} cy={16} r={1.5} fill="#AAAAAA" />
              </Svg>
              <TextInput
                ref={pwdRef}
                style={styles.fieldInput}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Enter your password"
                placeholderTextColor="#CCCCCC"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} activeOpacity={0.7}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  {showPwd ? (
                    <>
                      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                      <Circle cx={12} cy={12} r={3} stroke="#AAAAAA" strokeWidth={1.8} fill="none" />
                    </>
                  ) : (
                    <>
                      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#AAAAAA" strokeWidth={1.8} fill="none" strokeLinecap="round" />
                      <Path d="M1 1l22 22" stroke="#AAAAAA" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                    </>
                  )}
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Error ── */}
          {error.length > 0 && (
            <Text style={styles.errorTxt}>{error}</Text>
          )}

          {/* ── Forgot password ── */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          {/* ── Sign in CTA ── */}
          <TouchableOpacity
            style={[styles.cta, !canSubmit && styles.ctaDim]}
            disabled={!canSubmit}
            onPress={handleSignIn}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaTxt}>Sign in</Text>
            }
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divTxt}>or continue with</Text>
            <View style={styles.divLine} />
          </View>

          {/* ── Social buttons ── */}
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

          {/* ── Sign up ── */}
          <View style={styles.signupRow}>
            <Text style={styles.signupTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} activeOpacity={0.7}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Biometrics ── */}
          <TouchableOpacity style={styles.bioRow} onPress={handleBio} activeOpacity={0.7}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#CCCCCC" strokeWidth={1.5} fill="none" />
              <Path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" stroke="#CCCCCC" strokeWidth={1.5} fill="none" />
              <Circle cx={12} cy={12} r={2} fill="#CCCCCC" />
            </Svg>
            <Text style={styles.bioTxt}>Use biometrics to sign in faster</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  top:    { alignItems: 'center', paddingTop: 40, marginBottom: 32 },
  appIconWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#0F2419',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.4, marginBottom: 6 },
  sub:   { fontSize: 13, color: '#AAAAAA' },
  fieldWrap: { marginBottom: 14 },
  fieldLbl:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 7 },
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12,
    backgroundColor: '#FAFAFA', paddingHorizontal: 13,
    minHeight: 50, gap: 10,
  },
  fieldValid:  { borderColor: '#22C55E', backgroundColor: '#F9FFF9' },
  fieldIcon:   { flexShrink: 0 },
  fieldInput:  { flex: 1, fontSize: 14, color: '#0A0A0A', padding: 0 },
  errorTxt:    { fontSize: 12, color: '#DC2626', marginBottom: 6, marginLeft: 2 },
  forgotRow:   { alignItems: 'flex-end', marginBottom: 18 },
  forgotTxt:   { fontSize: 13, fontWeight: '700', color: '#0F2419' },
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  ctaDim: { opacity: 0.5 },
  ctaTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  divTxt:  { fontSize: 12, color: '#CCCCCC' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#fff',
  },
  socialTxt: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  signupTxt:  { fontSize: 13, color: '#AAAAAA' },
  signupLink: { fontSize: 13, fontWeight: '800', color: '#0F2419' },
  bioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bioTxt: { fontSize: 12, color: '#CCCCCC' },
});