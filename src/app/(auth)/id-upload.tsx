/**
 * IDUploadScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Step 2 of 4 — Government ID upload.
 * Matches ooooyy.png + oooooyyy.png exactly.
 *
 * DUAL ENTRY POINT PATTERN:
 * ─────────────────────────────────────────────────────────────────────
 * This screen works in two contexts:
 *
 *  1. KYC auth flow  → shows step bar, "Step 2 of 4" header
 *     Route: /(auth)/kyc/id-upload
 *     URL param: ?source=auth   (or no param, defaults to auth)
 *
 *  2. Profile settings → no step bar, "Verify identity" standalone
 *     Route: /(protected)/settings/kyc/id-upload
 *     URL param: ?source=profile
 *
 * The `source` param drives:
 *   - Whether StepBar renders
 *   - Header subtitle text
 *   - Where "I'll do this later" navigates to
 *   - Where "Continue" navigates after upload
 *
 * API INTEGRATION:
 *  → uploadIDDocument(file, docType) — replace TODO in handleUpload()
 *    Accepts a file URI + document type string
 *    Returns: { status: 'pending' | 'approved' | 'rejected' }
 * ─────────────────────────────────────────────────────────────────────
 */

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = 'nin' | 'voter' | 'passport' | 'driver';
type Source  = 'auth' | 'profile';

interface DocOption {
  id:    DocType;
  label: string;
  sub:   string;
  icon:  React.ReactNode;
}

// ─── Doc options ──────────────────────────────────────────────────────────────

const DOC_OPTIONS: DocOption[] = [
  {
    id: 'nin',
    label: 'NIN slip',
    sub:   'National Identity Number',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          stroke="#2E7D32" strokeWidth={1.6} fill="none" />
        <Path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"
          stroke="#2E7D32" strokeWidth={1.6} fill="none" />
        <Circle cx={12} cy={12} r={2} fill="#2E7D32" />
      </Svg>
    ),
  },
  {
    id: 'voter',
    label: 'Voter\'s card',
    sub:   'INEC Permanent Voter Card',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d="M12 20h-7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"
          stroke="#888" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Path d="M16 19l2 2 4-4" stroke="#888" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Path d="M8 10h8M8 14h4" stroke="#888" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      </Svg>
    ),
  },
  {
    id: 'passport',
    label: 'International passport',
    sub:   'Valid within 6 months of expiry',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.6} fill="none" />
        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          stroke="#888" strokeWidth={1.4} fill="none" />
        <Path d="M2 12h20" stroke="#888" strokeWidth={1.4} fill="none" />
      </Svg>
    ),
  },
  {
    id: 'driver',
    label: 'Driver\'s licence',
    sub:   'FRSC issued licence',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Rect x={1} y={3} width={22} height={18} rx={3} stroke="#2E7D32" strokeWidth={1.6} fill="none" />
        <Circle cx={8} cy={12} r={3} stroke="#2E7D32" strokeWidth={1.4} fill="none" />
        <Path d="M14 9h5M14 13h3" stroke="#2E7D32" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      </Svg>
    ),
  },
];

// ─── Step Bar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'BVN' },
  { id: 2, label: 'ID' },
  { id: 3, label: 'Selfie' },
  { id: 4, label: 'Address' },
];

function StepBar() {
  // Step 1 = done (BVN complete), Step 2 = active
  return (
    <View style={styles.stepTrack}>
      {STEPS.map((s, i) => {
        const isDone   = s.id === 1;
        const isActive = s.id === 2;
        return (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <View style={styles.stepNode}>
              <View style={[
                styles.stepDot,
                isDone   && styles.stepDotDone,
                isActive && styles.stepDotActive,
              ]}>
                {isDone ? (
                  <Svg width={11} height={11} viewBox="0 0 24 24">
                    <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                  </Svg>
                ) : (
                  <Text style={[styles.stepDotTxt, (isActive) && { color: '#fff' }]}>{s.id}</Text>
                )}
              </View>
              <Text style={[styles.stepLbl, (isDone || isActive) && styles.stepLblOn]}>{s.label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocCard({
  option,
  selected,
  onSelect,
}: {
  option: DocOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onSelect();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[
        styles.docCard,
        selected && styles.docCardSelected,
        { transform: [{ scale: scaleAnim }] },
      ]}>
        <View style={[styles.docIcon, selected && styles.docIconSelected]}>
          {option.icon}
        </View>
        <View style={styles.docInfo}>
          <Text style={[styles.docLabel, selected && styles.docLabelSelected]}>
            {option.label}
          </Text>
          <Text style={styles.docSub}>{option.sub}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && (
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            </Svg>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onCamera,
  onGallery,
  fileSelected,
}: {
  onCamera: () => void;
  onGallery: () => void;
  fileSelected: boolean;
}) {
  return (
    <View style={[styles.uploadZone, fileSelected && styles.uploadZoneActive]}>
      <View style={styles.uploadIconWrap}>
        {fileSelected ? (
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={10} fill="#E8F5E9" />
            <Path d="M8 12l3 3 5-5" stroke="#2E7D32" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        ) : (
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Path d="M17 8l-5-5-5 5M12 3v12"
              stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
        )}
      </View>
      <Text style={styles.uploadTitle}>
        {fileSelected ? 'Document ready' : 'Take a photo or upload'}
      </Text>
      <Text style={styles.uploadSub}>
        {fileSelected ? 'Tap Camera or Gallery to change' : 'JPG, PNG or PDF · Max 10MB'}
      </Text>
      <View style={styles.uploadBtnRow}>
        <TouchableOpacity style={styles.uploadBtn} onPress={onCamera} activeOpacity={0.75}>
          <Svg width={15} height={15} viewBox="0 0 24 24">
            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="#0A0A0A" strokeWidth={1.8} fill="none" />
            <Circle cx={12} cy={13} r={4} stroke="#0A0A0A" strokeWidth={1.6} fill="none" />
          </Svg>
          <Text style={styles.uploadBtnTxt}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={onGallery} activeOpacity={0.75}>
          <Svg width={15} height={15} viewBox="0 0 24 24">
            <Rect x={3} y={3} width={18} height={18} rx={3} stroke="#0A0A0A" strokeWidth={1.8} fill="none" />
            <Circle cx={8.5} cy={8.5} r={1.5} fill="#0A0A0A" />
            <Path d="M21 15l-5-5L5 21" stroke="#0A0A0A" strokeWidth={1.6} strokeLinecap="round" fill="none" />
          </Svg>
          <Text style={styles.uploadBtnTxt}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IDUploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();

  // 'auth'    → came from KYC onboarding flow (shows step bar)
  // 'profile' → came from profile settings (no step bar, different nav)
  const source: Source = (params.source as Source) ?? 'auth';
  const isProfileFlow  = source === 'profile';

  const [selectedDoc, setSelectedDoc] = useState<DocType>('driver');
  const [fileUri,     setFileUri]     = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);

  const fileSelected = Boolean(fileUri);
  const canContinue = fileSelected;

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to take a photo of your ID.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFileUri(result.assets[0].uri);
    }

    return;
    // ── TODO: launch expo-image-picker with camera ─────────────────
    // const result = await ImagePicker.launchCameraAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   quality: 0.9,
    // });
    // if (!result.canceled) setFileSelected(true);
    // ──────────────────────────────────────────────────────────────
  };

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery permission required', 'Please allow photo library access to upload your ID.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFileUri(result.assets[0].uri);
    }

    return;
    // ── TODO: launch expo-image-picker with gallery ────────────────
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   quality: 0.9,
    // });
    // if (!result.canceled) setFileSelected(true);
    // ──────────────────────────────────────────────────────────────
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setUploading(true);
    try {
      // ── TODO: upload document ─────────────────────────────────────
      // await uploadIDDocument(fileUri, selectedDoc);
      // ─────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200)); // mock

      if (isProfileFlow) {
        // From profile → go back with success param
        router.back();
        // Or: router.replace('/(protected)/settings/kyc/success');
      } else {
        // From auth KYC flow → next step
        router.push('/(auth)/kyc/selfie' as any);
      }
    } catch (e) {
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLater = () => {
    if (isProfileFlow) {
      router.back();
    } else {
      // From auth → skip to main app but mark KYC as incomplete
      router.replace('/(protected)/(tabs)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M19 12H5M12 5l-7 7 7 7"
              stroke="#555" strokeWidth={2} strokeLinecap="round" fill="none" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Verify your identity</Text>
          <Text style={styles.topSub}>
            {isProfileFlow
              ? 'Required by CBN regulation'
              : 'Step 2 of 4 · Government ID'}
          </Text>
        </View>

        {!isProfileFlow && (
          <Text style={styles.topStep}>2 of 4</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step bar — only in auth flow ── */}
        {!isProfileFlow && <StepBar />}

        {/* ── Hero ── */}
        <View style={styles.heroWrap}>
          <View style={styles.heroIcon}>
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Rect x={2} y={5} width={20} height={14} rx={3}
                stroke="#2E7D32" strokeWidth={1.8} fill="none" />
              <Circle cx={8} cy={12} r={3} stroke="#2E7D32" strokeWidth={1.5} fill="none" />
              <Path d="M14 10h5M14 14h3"
                stroke="#2E7D32" strokeWidth={1.5} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.heroTitle}>Upload your government ID</Text>
          <Text style={styles.heroSub}>
            We need a valid ID to verify your identity as required by CBN investment account regulations.
          </Text>
        </View>

        {/* ── Document type selector ── */}
        <Text style={styles.sectionLbl}>SELECT DOCUMENT TYPE</Text>
        <View style={styles.docList}>
          {DOC_OPTIONS.map(opt => (
            <DocCard
              key={opt.id}
              option={opt}
              selected={selectedDoc === opt.id}
              onSelect={() => setSelectedDoc(opt.id)}
            />
          ))}
        </View>

        {/* ── Upload zone ── */}
        <Text style={styles.sectionLbl}>UPLOAD DOCUMENT</Text>
        <UploadZone
          onCamera={handleCamera}
          onGallery={handleGallery}
          fileSelected={fileSelected}
        />

        {/* ── Photo requirements ── */}
        <View style={styles.reqCard}>
          <View style={styles.reqHead}>
            <Svg width={15} height={15} viewBox="0 0 24 24">
              <Circle cx={12} cy={12} r={10} stroke="#888" strokeWidth={1.8} fill="none" />
              <Path d="M12 8v4M12 16h.01" stroke="#888" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </Svg>
            <Text style={styles.reqTitle}>Photo requirements</Text>
          </View>
          {[
            { text: 'All four corners visible',       ok: true  },
            { text: 'No glare or flash reflection',   ok: true  },
            { text: 'Text must be clearly readable',  ok: true  },
            { text: 'No photocopies or screenshots',  ok: false },
          ].map((r, i, arr) => (
            <View
              key={r.text}
              style={[styles.reqRow, i < arr.length - 1 && styles.reqRowBorder]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24">
                {r.ok ? (
                  <Path d="M5 12l5 5L19 7" stroke="#2E7D32" strokeWidth={2.2} strokeLinecap="round" fill="none" />
                ) : (
                  <Path d="M18 6L6 18M6 6l12 12" stroke="#C62828" strokeWidth={2.2} strokeLinecap="round" fill="none" />
                )}
              </Svg>
              <Text style={[styles.reqText, !r.ok && styles.reqTextNo]}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Data protection notice ── */}
        <View style={styles.secNotice}>
          <Svg width={17} height={17} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <Path d="M12 2l8 4v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V6l8-4z"
              stroke="#E65100" strokeWidth={1.8} fill="none" />
            <Path d="M9 12l2 2 4-4" stroke="#E65100" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={styles.secNoticeTitle}>Your data is protected</Text>
            <Text style={styles.secNoticeSub}>
              Encrypted with 256-bit TLS. Only used for CBN identity verification. Never shared with third parties.
            </Text>
          </View>
        </View>

        {/* ── Continue CTA ── */}
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          disabled={!canContinue || uploading}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.ctaTxt, !canContinue && styles.ctaTxtDisabled]}>
                Continue
              </Text>
          }
        </TouchableOpacity>

        {/* "I'll do this later" — always visible */}
        <TouchableOpacity
          style={styles.laterBtn}
          onPress={handleLater}
          activeOpacity={0.75}
        >
          <Text style={styles.laterTxt}>I'll do this later</Text>
        </TouchableOpacity>

        {/* Security footer */}
        <View style={styles.secFooter}>
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Rect x={3} y={11} width={18} height={11} rx={2}
              stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="#CCCCCC" strokeWidth={1.8} fill="none" />
          </Svg>
          <Text style={styles.secFooterTxt}>256-bit TLS · NDPR compliant · CBN licensed</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE',
    gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  topCenter:  { flex: 1 },
  topTitle:   { fontSize: 14, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.2 },
  topSub:     { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  topStep:    { fontSize: 11, color: '#AAAAAA' },

  scroll: { paddingHorizontal: 20, paddingTop: 18 },

  // Step bar
  stepTrack: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepNode: { alignItems: 'center', gap: 4, flexShrink: 0 },
  stepLine: {
    flex: 1, height: 1.5,
    backgroundColor: '#E8E8E8',
    marginTop: 14, marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: '#0F2419' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: '#0F2419', borderColor: '#0F2419' },
  stepDotActive: {
    backgroundColor: '#0F2419', borderColor: '#0F2419',
    shadowColor: '#0F2419',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepDotTxt:  { fontSize: 10, fontWeight: '700', color: '#AAAAAA' },
  stepLbl:     { fontSize: 9, fontWeight: '600', color: '#CCCCCC' },
  stepLblOn:   { color: '#0F2419' },

  // Hero
  heroWrap: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 62, height: 62, borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 17, fontWeight: '700', color: '#0A0A0A',
    letterSpacing: -0.3, marginBottom: 8, textAlign: 'center',
  },
  heroSub: {
    fontSize: 12, color: '#AAAAAA', textAlign: 'center',
    lineHeight: 19, paddingHorizontal: 10,
  },

  // Section label
  sectionLbl: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 1.3, marginBottom: 10,
  },

  // Doc cards
  docList: { gap: 8, marginBottom: 22 },
  docCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderRadius: 14, borderWidth: 1, borderColor: '#EEEEEE',
    backgroundColor: '#fff',
  },
  docCardSelected: {
    borderColor: '#0F2419', borderWidth: 1.5,
    backgroundColor: '#F0FBF5',
  },
  docIcon: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  docIconSelected: { backgroundColor: '#E8F5E9' },
  docInfo:          { flex: 1 },
  docLabel:         { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },
  docLabelSelected: { color: '#0F2419', fontWeight: '700' },
  docSub:           { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioSelected: { backgroundColor: '#0F2419', borderColor: '#0F2419' },

  // Upload zone
  uploadZone: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  uploadZoneActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FBF5',
  },
  uploadIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  uploadTitle: { fontSize: 13, fontWeight: '700', color: '#0A0A0A', marginBottom: 4 },
  uploadSub:   { fontSize: 11, color: '#AAAAAA', marginBottom: 14 },
  uploadBtnRow:{ flexDirection: 'row', gap: 10 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  uploadBtnTxt: { fontSize: 13, fontWeight: '600', color: '#0A0A0A' },

  // Requirements card
  reqCard: {
    backgroundColor: '#FAFAFA', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#EBEBEB',
    padding: 14, marginBottom: 14,
  },
  reqHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  reqTitle: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },
  reqRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  reqRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE' },
  reqText:   { fontSize: 12, color: '#555' },
  reqTextNo: { color: '#C62828' },

  // Security notice
  secNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFF8E1', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#FFE082',
    padding: 12, marginBottom: 18,
  },
  secNoticeTitle: { fontSize: 12, fontWeight: '700', color: '#BF360C', marginBottom: 3 },
  secNoticeSub:   { fontSize: 11, color: '#E65100', lineHeight: 17 },

  // CTAs
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  ctaDisabled: { backgroundColor: '#EBEBEB' },
  ctaTxt:         { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaTxtDisabled: { color: '#BBBBBB' },
  laterBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#E0E0E0', marginBottom: 14,
  },
  laterTxt: { fontSize: 14, fontWeight: '600', color: '#888' },

  // Footer
  secFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secFooterTxt: { fontSize: 11, color: '#CCCCCC' },
});
