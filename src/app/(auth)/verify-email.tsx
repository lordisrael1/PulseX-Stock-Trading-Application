import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const email = useMemo(
    () => (typeof params.email === 'string' && params.email.length > 0 ? params.email : 'your email'),
    [params.email]
  );
  const codeReady = code.length === 6;

  const handleCodeChange = (text: string) => {
    setCode(text.replace(/\D/g, '').slice(0, 6));
  };

  const handleContinue = async () => {
    if (!codeReady || loading) return;
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      router.push('/(auth)/bvn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setResent(true);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Verify email</Text>
          <Text style={styles.headerSub}>Secure your PulseX account</Text>
        </View>
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
          <View style={styles.topBlock}>
            <View style={styles.mailIcon}>
              <Svg width={38} height={38} viewBox="0 0 24 24">
                <Rect x={2} y={5} width={20} height={14} rx={3} stroke="#0F2419" strokeWidth={1.8} fill="none" />
                <Path d="M3 8l9 6 9-6" stroke="#0F2419" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                <Circle cx={18} cy={6} r={3.5} fill="#4ADE80" />
              </Svg>
            </View>

            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.sub}>
              We sent a 6-digit verification code to{' '}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLbl}>VERIFICATION CODE</Text>
            <View style={[styles.codeBox, codeReady && styles.codeBoxValid]}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor="#D8D8D8"
                returnKeyType="done"
                textContentType="oneTimeCode"
                onSubmitEditing={handleContinue}
              />
              {codeReady && (
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill="#22C55E" />
                  <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
                </Svg>
              )}
            </View>
            <View style={styles.fieldMeta}>
              <Text style={[styles.fieldHint, codeReady && styles.fieldHintValid]}>
                {codeReady ? 'Code ready' : 'Enter the code from your email'}
              </Text>
              <Text style={styles.fieldCount}>{code.length} / 6</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
                  stroke="#166534"
                  strokeWidth={1.8}
                  fill="none"
                />
                <Path d="M9 12l2 2 4-4" stroke="#166534" strokeWidth={1.8} strokeLinecap="round" fill="none" />
              </Svg>
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Your account stays protected</Text>
              <Text style={styles.infoText}>
                Email verification helps us protect withdrawals, password resets, and important account alerts.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cta, (!codeReady || loading) && styles.ctaDim]}
            disabled={!codeReady || loading}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaTxt}>Continue</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendTxt}>
              {resent ? 'A new code has been sent. ' : "Didn't receive it? "}
            </Text>
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.changeEmailRow} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.changeEmailTxt}>Use a different email</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  headerSub: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  topBlock: { alignItems: 'center', paddingTop: 36, marginBottom: 28 },
  mailIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 20,
    textAlign: 'center',
  },
  emailText: { color: '#0A0A0A', fontWeight: '800' },
  fieldWrap: { marginBottom: 18 },
  fieldLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 10,
  },
  codeBoxValid: { borderColor: '#22C55E', backgroundColor: '#F9FFF9' },
  codeInput: {
    flex: 1,
    color: '#0A0A0A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    padding: 0,
    textAlign: 'center',
  },
  fieldMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginHorizontal: 2,
  },
  fieldHint: { fontSize: 11, color: '#AAAAAA' },
  fieldHintValid: { color: '#22C55E', fontWeight: '700' },
  fieldCount: { fontSize: 11, color: '#AAAAAA' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoCopy: { flex: 1 },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#0A0A0A', marginBottom: 3 },
  infoText: { fontSize: 12, color: '#888', lineHeight: 18 },
  cta: {
    backgroundColor: '#0F2419',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaDim: { opacity: 0.45 },
  ctaTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  resendTxt: { fontSize: 13, color: '#AAAAAA' },
  resendLink: { fontSize: 13, color: '#0F2419', fontWeight: '800' },
  changeEmailRow: { alignItems: 'center' },
  changeEmailTxt: { fontSize: 13, color: '#AAAAAA', fontWeight: '600' },
});
