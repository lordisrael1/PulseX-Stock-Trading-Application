/**
 * BVNVerificationScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Step 1 of 4 — BVN verification. Matches 0067676767.png exactly.
 *
 * States:
 *  entry      → user types BVN, CTA disabled until 11 digits
 *  verifying  → animated progress, 3 checklist items tick sequentially
 *  success    → verified details card (masked), continue to Step 2
 *  error      → failure reasons, retry + contact support
 *
 * API INTEGRATION:
 *  → verifyBVN(bvn: string) — replace TODO in handleVerify()
 *    Expected response: { name: string; dob: string; status: 'clear' | 'flagged' }
 *    On failure: throw an error with a message
 *
 * NAVIGATION:
 *  → On success "Continue" → replace TODO in handleContinue()
 *    e.g. router.push('/(auth)/kyc/id-upload')
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
// ─── Types ────────────────────────────────────────────────────────────────────

type FlowState = 'entry' | 'verifying' | 'success' | 'error';

interface VerifiedData {
  name: string;
  bvn: string;
  dob: string;
  status: 'clear' | 'flagged';
}

// ─── Mock verifyBVN — replace with real API call ──────────────────────────────

async function verifyBVN(bvn: string): Promise<VerifiedData> {
  // ── TODO: replace with your backend call ──────────────────────────
  // const res = await fetch('https://your-api.pulsex.io/kyc/verify-bvn', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify({ bvn }),
  // });
  // if (!res.ok) throw new Error('BVN not found or invalid');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────

  await new Promise(r => setTimeout(r, 3200)); // simulate NIBSS roundtrip

  // Simulate failure for all-zeros
  if (bvn === '00000000000') {
    throw new Error('BVN not found. Please check the number and try again.');
  }

  return {
    name: 'JOSEPH ISRAEL MOJOLAOLUWA',
    bvn: `${bvn.slice(0, 3)} •••• •••• ${bvn.slice(-1)}`,
    dob: '••-••-199•',
    status: 'clear',
  };
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'BVN' },
  { id: 2, label: 'ID' },
  { id: 3, label: 'Selfie' },
  { id: 4, label: 'Address' },
];

function StepBar({ active, done }: { active: number; done: number[] }) {
  return (
    <View style={styles.stepTrack}>
      {STEPS.map((s, i) => {
        const isDone   = done.includes(s.id);
        const isActive = s.id === active;
        return (
          <View key={s.id} style={styles.stepNodeWrap}>
            {i > 0 && (
              <View
                style={[
                  styles.stepLine,
                  isDone && styles.stepLineDone,
                ]}
              />
            )}
            <View style={styles.stepNode}>
              <View
                style={[
                  styles.stepDot,
                  isDone   && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isDone ? (
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path
                      d="M5 12l5 5L19 7"
                      stroke="#fff"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                ) : (
                  <Text
                    style={[
                      styles.stepDotTxt,
                      (isDone || isActive) && { color: '#fff' },
                    ]}
                  >
                    {s.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isDone || isActive) && styles.stepLabelOn,
                ]}
              >
                {s.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Animated Check Item ──────────────────────────────────────────────────────

function CheckItem({
  label,
  done,
  delay,
}: {
  label: string;
  done: boolean;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }).start();
    }
  }, [done]);

  return (
    <View style={styles.checkRow}>
      <View
        style={[
          styles.checkDot,
          done && styles.checkDotDone,
        ]}
      >
        {done && (
          <Animated.View style={{ opacity: anim }}>
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path
                d="M5 12l5 5L19 7"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        )}
      </View>
      <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BVNVerificationScreen() {
  const router = useRouter();

  const [bvn,       setBvn]       = useState('');
  const [flow,      setFlow]      = useState<FlowState>('entry');
  const [errMsg,    setErrMsg]    = useState('');
  const [verified,  setVerified]  = useState<VerifiedData | null>(null);

  // Progress simulation for verifying state
  const [progPct,   setProgPct]   = useState(0);
  const [progLabel, setProgLabel] = useState('Connecting to NIBSS…');
  const [checks,    setChecks]    = useState([false, false, false]);

  // Pulse animation for verifying icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (flow !== 'verifying') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flow]);

  const isValid   = bvn.length === 11;

  const handleBvnChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setBvn(digits);
  };

  const handleVerify = useCallback(async () => {
    setFlow('verifying');
    setProgPct(0);
    setProgLabel('Connecting to NIBSS…');
    setChecks([false, false, false]);

    // Simulate step-by-step progress
    const steps = [
      { pct: 25, label: 'Connecting to NIBSS…',        check: -1 },
      { pct: 50, label: 'Validating BVN number…',      check: 0  },
      { pct: 75, label: 'Checking identity records…',  check: 1  },
      { pct: 90, label: 'Finalising…',                 check: 2  },
    ];

    let si = 0;
    const iv = setInterval(() => {
      if (si < steps.length) {
        const s = steps[si];
        setProgPct(s.pct);
        setProgLabel(s.label);
        if (s.check >= 0) {
          setChecks(prev => {
            const next = [...prev];
            next[s.check] = true;
            return next;
          });
        }
        si++;
      } else {
        clearInterval(iv);
      }
    }, 700);

    try {
      const data = await verifyBVN(bvn);
      clearInterval(iv);
      setProgPct(100);
      setProgLabel('Verified');
      setChecks([true, true, true]);
      await new Promise(r => setTimeout(r, 400));
      setVerified(data);
      setFlow('success');
    } catch (e: any) {
      clearInterval(iv);
      setErrMsg(e?.message ?? 'BVN verification failed. Please try again.');
      setFlow('error');
    }
  }, [bvn]);

  const handleRetry = () => {
    setBvn('');
    setErrMsg('');
    setVerified(null);
    setFlow('entry');
  };

  const handleContinue = () => {
    // ── TODO: navigate to next KYC step ───────────────────────────
    // router.push('/(auth)/kyc/id-upload');
    // ─────────────────────────────────────────────────────────────
    router.push('/(auth)/kyc/id-upload' as any);
  };

  const activeStep = flow === 'success' ? 2 : 1;
  const doneSteps  = flow === 'success' ? [1] : [];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            flow === 'entry' ? router.back() : handleRetry()
          }
          activeOpacity={0.7}
        >
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

        <View style={styles.topBarCenter}>
          <Text style={styles.topTitle}>Verify your identity</Text>
          <Text style={styles.topSub}>
            {flow === 'success'
              ? 'BVN verified successfully'
              : flow === 'verifying'
              ? 'Contacting NIBSS registry…'
              : flow === 'error'
              ? 'Verification failed'
              : 'Step 1 of 4 · BVN verification'}
          </Text>
        </View>

        <Text style={styles.topStepCount}>
          {flow === 'success' ? '2 of 4' : '1 of 4'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step bar ── */}
          <StepBar active={activeStep} done={doneSteps} />

          {/* ══════════ ENTRY STATE ══════════ */}
          {flow === 'entry' && (
            <>
              {/* Icon + title */}
              <View style={styles.heroWrap}>
                <View style={styles.heroIcon}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      stroke="#2E7D32"
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <Path
                      d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
                      stroke="#2E7D32"
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <Circle cx={12} cy={12} r={2} fill="#2E7D32" />
                  </Svg>
                </View>
                <Text style={styles.heroTitle}>Enter your BVN</Text>
                <Text style={styles.heroSub}>
                  Your Bank Verification Number links your identity to your investment account as required by CBN.
                </Text>
              </View>

              {/* BVN field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLbl}>BANK VERIFICATION NUMBER</Text>
                <View
                  style={[
                    styles.bvnBox,
                    bvn.length === 11 && styles.bvnBoxValid,
                  ]}
                >
                  <TextInput
                    style={styles.bvnInput}
                    value={bvn}
                    onChangeText={handleBvnChange}
                    keyboardType="number-pad"
                    maxLength={11}
                    placeholder="00000000000"
                    placeholderTextColor="#DDDDDD"
                    returnKeyType="done"
                    onSubmitEditing={isValid ? handleVerify : undefined}
                  />
                  {bvn.length === 11 && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.bvnCheck}>
                      <Circle cx={12} cy={12} r={10} fill="#2E7D32" />
                      <Path
                        d="M8 12l3 3 5-5"
                        stroke="#fff"
                        strokeWidth={2}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </Svg>
                  )}
                </View>
                <View style={styles.fieldMeta}>
                  <Text style={[styles.fieldHint, bvn.length === 11 && styles.fieldHintValid]}>
                    {bvn.length === 11 ? 'Looks good' : '11 digits'}
                  </Text>
                  <Text style={styles.fieldCount}>{bvn.length} / 11</Text>
                </View>
              </View>

              {/* How to find BVN */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHead}>
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.8} fill="none" />
                    <Path d="M12 8v4M12 16h.01" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                  </Svg>
                  <Text style={styles.infoCardTitle}>How to find your BVN</Text>
                </View>

                {[
                  {
                    icon: (
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Rect x={5} y={2} width={14} height={20} rx={3} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                        <Circle cx={12} cy={18} r={1} fill="#2E7D32" />
                      </Svg>
                    ),
                    title: 'Dial *565*0#',
                    sub:   'Works on any Nigerian network',
                  },
                  {
                    icon: (
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Rect x={2} y={3} width={20} height={18} rx={3} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                        <Path d="M8 10h8M8 14h5" stroke="#2E7D32" strokeWidth={1.5} strokeLinecap="round" fill="none" />
                      </Svg>
                    ),
                    title: 'Check your banking app',
                    sub:   'Under profile or account settings',
                  },
                  {
                    icon: (
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Rect x={2} y={4} width={20} height={16} rx={3} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                        <Path d="M2 10h20" stroke="#2E7D32" strokeWidth={1.5} fill="none" />
                      </Svg>
                    ),
                    title: 'Bank statement or debit card',
                    sub:   'Usually printed on the reverse',
                  },
                ].map((item, i, arr) => (
                  <View
                    key={i}
                    style={[
                      styles.infoRow,
                      i < arr.length - 1 && styles.infoRowBorder,
                    ]}
                  >
                    <View style={styles.infoRowIcon}>{item.icon}</View>
                    <View style={styles.infoRowText}>
                      <Text style={styles.infoRowTitle}>{item.title}</Text>
                      <Text style={styles.infoRowSub}>{item.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Security notice */}
              <View style={styles.secNotice}>
                <Svg width={17} height={17} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                  <Path
                    d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
                    stroke="#E65100"
                    strokeWidth={1.8}
                    fill="none"
                  />
                  <Path d="M9 12l2 2 4-4" stroke="#E65100" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
                <Text style={styles.secNoticeTxt}>
                  Your BVN is encrypted and only used to verify your name. We never access your account or transaction history.
                </Text>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.cta, !isValid && styles.ctaDisabled]}
                disabled={!isValid}
                onPress={handleVerify}
                activeOpacity={0.85}
              >
                <Text style={[styles.ctaTxt, !isValid && styles.ctaTxtDisabled]}>
                  Verify BVN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.ghostRow} activeOpacity={0.7}>
                <Text style={styles.ghostTxt}>Don't have a BVN? </Text>
                <Text style={styles.ghostLink}>Learn how to get one</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ══════════ VERIFYING STATE ══════════ */}
          {flow === 'verifying' && (
            <>
              <View style={styles.heroWrap}>
                <Animated.View style={[styles.heroIcon, { opacity: pulseAnim }]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      stroke="#2E7D32" strokeWidth={1.5} fill="none"
                    />
                    <Path
                      d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
                      stroke="#2E7D32" strokeWidth={1.5} fill="none"
                    />
                    <Circle cx={12} cy={12} r={2} fill="#2E7D32" />
                  </Svg>
                </Animated.View>
                <Text style={styles.heroTitle}>Verifying your BVN</Text>
                <Text style={styles.heroSub}>
                  Connecting to the NIBSS BVN registry. This takes a few seconds.
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progBarTrack}>
                <Animated.View
                  style={[styles.progBarFill, { width: `${progPct}%` as any }]}
                />
              </View>
              <Text style={styles.progLabel}>{progLabel}</Text>

              {/* Check items */}
              <View style={styles.checkCard}>
                <Text style={styles.checkCardTitle}>WHAT WE CHECK</Text>
                <CheckItem label="BVN number validity"     done={checks[0]} delay={0}   />
                <CheckItem label="Identity name match"     done={checks[1]} delay={100} />
                <CheckItem label="Watchlist clearance"     done={checks[2]} delay={200} />
              </View>

              <Text style={styles.doNotClose}>
                Do not close the app during verification
              </Text>
            </>
          )}

          {/* ══════════ SUCCESS STATE ══════════ */}
          {flow === 'success' && verified && (
            <>
              <View style={styles.heroWrap}>
                <View style={[styles.heroIcon, styles.heroIconSuccess]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Circle cx={12} cy={12} r={10} stroke="#2E7D32" strokeWidth={1.8} fill="none" />
                    <Path d="M8 12l3 3 5-5" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" fill="none" />
                  </Svg>
                </View>
                <Text style={styles.heroTitle}>BVN verified</Text>
                <Text style={styles.heroSub}>
                  Your identity has been confirmed via the NIBSS registry.
                </Text>
              </View>

              {/* Verified details */}
              <View style={styles.verifiedCard}>
                <Text style={styles.verifiedCardTitle}>VERIFIED DETAILS</Text>
                {[
                  { label: 'Full name',    value: verified.name   },
                  { label: 'BVN',          value: verified.bvn    },
                  { label: 'Date of birth',value: verified.dob    },
                  { label: 'Status',       value: verified.status === 'clear' ? '● Clear' : '● Flagged', isStatus: true },
                ].map((r, i, arr) => (
                  <View
                    key={r.label}
                    style={[styles.verifiedRow, i < arr.length - 1 && styles.verifiedRowBorder]}
                  >
                    <Text style={styles.verifiedLabel}>{r.label}</Text>
                    <Text style={[styles.verifiedValue, r.isStatus && { color: '#1B5E20' }]}>
                      {r.value}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.maskedNotice}>
                <Svg width={15} height={15} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.8} fill="none" />
                  <Path d="M12 8v4M12 16h.01" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </Svg>
                <Text style={styles.maskedNoticeTxt}>
                  Date of birth and name details are partially masked for your security.
                </Text>
              </View>

              <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
                <Text style={styles.ctaTxt}>Continue to ID upload</Text>
              </TouchableOpacity>

              <View style={styles.stepCompleteRow}>
                <Svg width={13} height={13} viewBox="0 0 24 24">
                  <Path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
                    stroke="#888" strokeWidth={1.8} fill="none" />
                </Svg>
                <Text style={styles.stepCompleteTxt}>Step 1 of 4 complete</Text>
              </View>
            </>
          )}

          {/* ══════════ ERROR STATE ══════════ */}
          {flow === 'error' && (
            <>
              <View style={styles.heroWrap}>
                <View style={[styles.heroIcon, styles.heroIconError]}>
                  <Svg width={30} height={30} viewBox="0 0 24 24">
                    <Path
                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                      stroke="#C62828" strokeWidth={1.8} fill="none"
                    />
                    <Path d="M12 9v4M12 17h.01" stroke="#C62828" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                  </Svg>
                </View>
                <Text style={styles.heroTitle}>Verification failed</Text>
                <Text style={styles.heroSub}>{errMsg}</Text>
              </View>

              <View style={styles.errorCard}>
                <Text style={styles.errorCardTitle}>Common reasons for failure</Text>
                {[
                  'BVN number entered incorrectly',
                  "Name on BVN doesn't match account",
                  'BVN flagged by NIBSS registry',
                ].map(r => (
                  <View key={r} style={styles.errorRow}>
                    <View style={styles.errorDot} />
                    <Text style={styles.errorRowTxt}>{r}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.cta} onPress={handleRetry} activeOpacity={0.85}>
                <Text style={styles.ctaTxt}>Try again</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cta, styles.ctaGhost, { marginTop: 8 }]} activeOpacity={0.75}>
                <Text style={styles.ctaGhostTxt}>Contact support</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE',
    backgroundColor: '#fff', gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarCenter: { flex: 1 },
  topTitle:     { fontSize: 14, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:       { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  topStepCount: { fontSize: 11, color: '#AAAAAA' },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },

  // Step bar
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  stepNodeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  stepLine: {
    height: 1.5,
    flex: 1,
    backgroundColor: '#E8E8E8',
    marginTop: 14,
  },
  stepLineDone: { backgroundColor: '#0F2419' },
  stepNode: { alignItems: 'center', gap: 5 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepDotActive: {
    backgroundColor: '#0F2419', borderColor: '#0F2419',
    // ring
    shadowColor: '#0F2419',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  stepDotTxt:   { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLabel:    { fontSize: 9, fontWeight: '600', color: '#CCCCCC', letterSpacing: 0.2 },
  stepLabelOn:  { color: '#0F2419' },

  // Hero
  heroWrap: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconSuccess: { backgroundColor: '#E8F5E9' },
  heroIconError:   { backgroundColor: '#FFEBEE' },
  heroTitle: {
    fontSize: 17, fontWeight: '700', color: '#0A0A0A',
    letterSpacing: -0.3, marginBottom: 8, textAlign: 'center',
  },
  heroSub: {
    fontSize: 12, color: '#AAAAAA', textAlign: 'center',
    lineHeight: 19, paddingHorizontal: 12,
  },

  // BVN field
  fieldWrap:  { marginBottom: 18 },
  fieldLbl:   { fontSize: 10, fontWeight: '700', color: '#AAAAAA', letterSpacing: 1.3, marginBottom: 8 },
  bvnBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14,
    backgroundColor: '#FAFAFA', paddingHorizontal: 16,
    minHeight: 54,
  },
  bvnBoxValid: { borderColor: '#2E7D32', backgroundColor: '#F9FFF9' },
  bvnInput: {
    flex: 1, fontSize: 22, fontWeight: '600', color: '#0A0A0A',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center', padding: 0,
  },
  bvnCheck: { marginLeft: 8, flexShrink: 0 },
  fieldMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginHorizontal: 2 },
  fieldHint:      { fontSize: 11, color: '#AAAAAA' },
  fieldHintValid: { color: '#2E7D32', fontWeight: '600' },
  fieldCount:     { fontSize: 11, color: '#AAAAAA' },

  // Info card
  infoCard: {
    backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB', padding: 14,
    marginBottom: 14,
  },
  infoCardHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  infoCardTitle:{ fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  infoRowBorder:{ borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE' },
  infoRowIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoRowText:  { flex: 1 },
  infoRowTitle: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  infoRowSub:   { fontSize: 11, color: '#AAAAAA', marginTop: 1 },

  // Security notice
  secNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFF8E1', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#FFE082',
    padding: 12, marginBottom: 20,
  },
  secNoticeTxt: { flex: 1, fontSize: 12, color: '#BF360C', lineHeight: 18 },

  // CTA
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#EBEBEB' },
  ctaTxt:        { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaTxtDisabled:{ color: '#BBBBBB' },
  ctaGhost: {
    backgroundColor: '#fff',
    borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  ctaGhostTxt: { fontSize: 15, fontWeight: '600', color: '#666' },

  // Ghost link
  ghostRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  ghostTxt:  { fontSize: 12, color: '#AAAAAA' },
  ghostLink: { fontSize: 12, fontWeight: '700', color: '#0F2419' },

  // Progress
  progBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: '#F0F0F0', overflow: 'hidden', marginBottom: 8,
  },
  progBarFill: { height: 4, borderRadius: 2, backgroundColor: '#0F2419' },
  progLabel:   { fontSize: 11, color: '#AAAAAA', marginBottom: 20, textAlign: 'center' },

  // Check items
  checkCard: {
    backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    padding: 14, marginBottom: 16,
  },
  checkCardTitle: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 1, marginBottom: 12,
  },
  checkRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkDotDone:  { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  checkLabel:    { fontSize: 12, color: '#AAAAAA' },
  checkLabelDone:{ color: '#0A0A0A', fontWeight: '600' },
  doNotClose:    { fontSize: 11, color: '#CCCCCC', textAlign: 'center' },

  // Verified card
  verifiedCard: {
    backgroundColor: '#F0FBF5', borderRadius: 16,
    borderWidth: 1, borderColor: '#A5D6A7',
    padding: 14, marginBottom: 14,
  },
  verifiedCardTitle: {
    fontSize: 10, fontWeight: '700', color: '#2E7D32',
    letterSpacing: 1, marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
  },
  verifiedRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#C8E6C9' },
  verifiedLabel: { fontSize: 12, color: '#4CAF50' },
  verifiedValue: { fontSize: 12, fontWeight: '700', color: '#1B5E20', flexShrink: 1, textAlign: 'right', marginLeft: 8 },

  // Masked notice
  maskedNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E0E0E0',
    padding: 12, marginBottom: 18,
  },
  maskedNoticeTxt: { flex: 1, fontSize: 11, color: '#888', lineHeight: 17 },
  stepCompleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12 },
  stepCompleteTxt: { fontSize: 11, color: '#AAAAAA' },

  // Error
  errorCard: {
    backgroundColor: '#FFF5F5', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#FFCDD2',
    padding: 14, marginBottom: 18,
  },
  errorCardTitle: { fontSize: 12, fontWeight: '700', color: '#C62828', marginBottom: 10 },
  errorRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  errorDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF5350', flexShrink: 0 },
  errorRowTxt:    { fontSize: 12, color: '#E53935' },
});
