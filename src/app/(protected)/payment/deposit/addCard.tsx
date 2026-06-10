/**
 * AddCardScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Production-grade Add Payment Card screen for PulseX.
 *
 * Card network detection is done CLIENT-SIDE from IIN/BIN prefix rules
 * (no API needed — this is the industry standard approach used by
 * Stripe, Flutterwave, Paystack, and every major fintech):
 *
 *   Visa        → starts with 4
 *   Mastercard  → starts with 51-55 OR 2221-2720
 *   Verve       → starts with 650002-650027 / 507850-507999 / 6500 / 6078
 *   Amex        → starts with 34 or 37
 *   Default     → unknown / blank
 *
 * SVG logos are inlined so there is zero dependency on external assets.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

// ─── Card Network Detection ───────────────────────────────────────────────────
// Pure client-side BIN/IIN prefix matching — no API, no network call.
// Source: published IIN ranges (ISO 7812).

export type CardNetwork = 'visa' | 'mastercard' | 'verve' | 'amex' | 'unknown';

interface VerveLogoProps {
  width?: number;
  height?: number;
}

export function detectNetwork(raw: string): CardNetwork {
  const n = raw.replace(/\D/g, '');
  if (!n) return 'unknown';

  // Amex: 34, 37
  if (/^3[47]/.test(n)) return 'amex';

  // Visa: starts with 4
  if (/^4/.test(n)) return 'visa';

  // Mastercard: 51-55 or 2221-2720
  if (/^5[1-5]/.test(n)) return 'mastercard';
  const d4 = parseInt(n.slice(0, 4), 10);
  if (d4 >= 2221 && d4 <= 2720) return 'mastercard';

  // Verve (Nigerian network): multiple BIN ranges
  const d6 = parseInt(n.slice(0, 6), 10);
  if (
    (d6 >= 650002 && d6 <= 650027) ||
    (d6 >= 507850 && d6 <= 507999) ||
    /^6500/.test(n) ||
    /^6078/.test(n)
  ) return 'verve';

  return 'unknown';
}

// ─── Card Number Formatter ────────────────────────────────────────────────────
// Groups into 4-4-4-4 (standard) or 4-6-5 for Amex.

function formatCardNumber(raw: string, network: CardNetwork): string {
  const digits = raw.replace(/\D/g, '');
  if (network === 'amex') {
    // Amex: 4-6-5
    return digits
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(' '),
      );
  }
  // Standard: 4-4-4-4
  return digits
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

// ─── SVG Brand Logos ─────────────────────────────────────────────────────────

function VisaLogo({ width = 38, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 38 24">
      <Rect width={38} height={24} rx={4} fill="#1A56A0" />
      <Path
        d="M15.6 16.8H13l1.6-9.6h2.6L15.6 16.8zM23.1 7.4c-.5-.2-1.3-.4-2.3-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1.3 2.2 2.2 2.6 1 .5 1.3.8 1.3 1.2 0 .6-.8 1-1.5 1-.7 0-1.1-.1-1.8-.3l-.2-.1-.3 1.7c.5.2 1.4.4 2.3.4 2.7 0 4.4-1.3 4.4-3.3 0-1.1-.7-1.9-2.1-2.6-.9-.4-1.4-.7-1.4-1.2 0-.4.5-.8 1.4-.8.8 0 1.4.2 1.8.3l.2.1.3-1.8zM27.4 7.2h-1.9c-.6 0-1 .2-1.3.7l-3.6 8.9h2.6l.5-1.4h3.1l.3 1.4h2.3l-2-9.6zm-3 5.7l1-2.7.5 2.7h-1.5zM11.5 7.2l-2.5 6.5-.3-1.3c-.5-1.6-2-3.4-3.7-4.3l2.3 8.7h2.7l4-9.6h-2.5z"
        fill="#fff"
      />
      <Path
        d="M7 7.2H3l-.1.2C5.8 8 7.8 9.7 8.7 12l-.9-4.1c-.1-.6-.5-.7-1.8-.7z"
        fill="#F9A533"
      />
    </Svg>
  );
}

function MastercardLogo({ width = 38, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 38 24">
      <Rect width={38} height={24} rx={4} fill="#252525" />
      <Circle cx={15} cy={12} r={6} fill="#EB001B" />
      <Circle cx={23} cy={12} r={6} fill="#F79E1B" />
      <Path
        d="M19 7.3a6 6 0 0 1 0 9.4A6 6 0 0 1 19 7.3z"
        fill="#FF5F00"
      />
    </Svg>
  );
}

// function VerveLogo({ width = 38, height = 24 }: { width?: number; height?: number }) {
//   return (
//     <Svg width={width} height={height} viewBox="0 0 38 24">
//       <Rect width={38} height={24} rx={4} fill="#0A5E30" />
//       <Path
//         d="M8 8h4l3 6 3-6h4L16 17h-4L8 8z"
//         fill="#fff"
//       />
//       <Circle cx={30} cy={12} r={4} fill="#F59E0B" />
//     </Svg>
//   );
// }

function VerveLogo({ width = 38, height = 24 }: VerveLogoProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 750 295.45"
    >
      <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <G id="verve" fillRule="nonzero">
          {/* Background Card */}
          <Rect
            id="Rectangle-path"
            fill="#00425F"
            x="0"
            y="0"
            width="750"
            height="295.450012"
            rx="20"
          />
          
          {/* Logo Elements Group */}
          <G id="Group" transform="translate(66.000000, 35.000000)">
            {/* Red Intersecting Circle */}
            <Circle
              id="Oval"
              fill="#EE312A"
              cx="107.5"
              cy="107.5"
              r="107.5"
            />
            
            {/* Letter 'V' */}
            <Path
              id="Shape-V"
              d="M107.499995,153.362725 C83.4681523,98.8873337 65.8448492,48 65.8448492,48 L29,48 C29,48 51.4257509,113.317063 93.080897,195 L121.919103,195 C163.574249,113.317063 186,48 186,48 L149.155141,48 C149.155141,48 131.531838,98.8873337 107.499995,153.362725 Z"
              fill="#FFFFFF"
            />
            
            {/* Letter 'e' (First) */}
            <Path
              id="Shape-e1"
              d="M621.113436,146.540569 L549.314677,146.540569 C549.314677,146.540569 550.909818,170.666883 582.820685,170.666883 C598.775608,170.666883 614.731728,165.837988 614.731728,165.837988 L617.923246,191.567306 C617.923246,191.567306 601.967125,198 579.629297,198 C547.719572,198 519,181.918591 519,136.891995 C519,101.513298 541.3365,79 573.247544,79 C621.113436,79 624.304953,127.243281 621.113436,146.540569 Z M571.652504,101.513298 C550.909771,101.513298 549.314677,124.026597 549.314677,124.026597 L593.989005,124.026597 C593.989005,124.026597 592.39391,101.513298 571.652504,101.513298 Z"
              fill="#FFFFFF"
            />
            
            {/* Letter 'r' */}
            <Path
              id="Shape-r"
              d="M373.214385,108.623324 L378,83.0294396 C378,83.0294396 341.041315,71.783453 311,92.627117 L311,195 L342.906457,195 L342.903941,111.822332 C355.665024,102.224785 373.214385,108.623324 373.214385,108.623324 Z"
              fill="#FFFFFF"
            />
            
            {/* Letter 'e' (Second) */}
            <Path
              id="Shape-e2"
              d="M286.113913,146.540569 L214.315713,146.540569 C214.315713,146.540569 215.910841,170.666883 247.82146,170.666883 C263.776259,170.666883 279.730937,165.837988 279.730937,165.837988 L282.922429,191.567306 C282.922429,191.567306 266.967761,198 244.630107,198 C212.719312,198 184,181.918591 184,136.891995 C184,101.513298 206.337654,79 238.248449,79 C286.113913,79 289.30405,127.243281 286.113913,146.540569 Z M236.652039,101.513298 C215.910795,101.513298 214.315713,124.026597 214.315713,124.026597 L258.989693,124.026597 C258.989693,124.026597 257.394601,101.513298 236.652039,101.513298 Z"
              fill="#FFFFFF"
            />
            
            {/* Letter 'v' */}
            <Path
              id="Shape-v2"
              d="M451,156.605781 C441.05272,132.406506 433.027561,107.460679 426.999064,82 L395,82.0042285 C395,82.0042285 411.000193,143.797279 438.202963,195 L463.797037,195 C490.999826,143.797279 507,82.0156194 507,82.0156194 L475.000936,82.0156194 C468.971104,107.470841 460.945967,132.411374 451,156.605781 Z"
              fill="#FFFFFF"
            />
          </G>
        </G>
      </G>
    </Svg>
  );
}


function AmexLogo({ width = 38, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 38 24">
      <Rect width={38} height={24} rx={4} fill="#2563EB" />
      <Path
        d="M5 9h4l1.5 4L12 9h4l-3 6H9L5 9zM17 9h8v1.5h-5.5v1H24V13h-4.5v1H25V15h-8V9z"
        fill="#fff"
      />
    </Svg>
  );
}

function DefaultLogo({ width = 38, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 38 24">
      <Rect width={38} height={24} rx={4} fill="#E8E8E8" />
      <Rect x={6} y={9} width={26} height={2} rx={1} fill="#CCCCCC" />
      <Rect x={6} y={14} width={10} height={2} rx={1} fill="#CCCCCC" />
    </Svg>
  );
}

function CardNetworkLogo({ network, width = 38, height = 24 }: {
  network: CardNetwork;
  width?: number;
  height?: number;
}) {
  if (network === 'visa')       return <VisaLogo width={width} height={height} />;
  if (network === 'mastercard') return <MastercardLogo width={width} height={height} />;
  if (network === 'verve')      return <VerveLogo width={width} height={height} />;
  if (network === 'amex')       return <AmexLogo width={width} height={height} />;
  return <DefaultLogo width={width} height={height} />;
}

// ─── Card Preview ─────────────────────────────────────────────────────────────

function CardPreview({
  number,
  name,
  expiry,
  network,
}: {
  number: string;
  name: string;
  expiry: string;
  network: CardNetwork;
}) {
  const maskedDisplay = number
    ? number.padEnd(network === 'amex' ? 17 : 19, ' ').replace(/ /g, ' ')
    : '•••• •••• •••• ____';

  // Show dots for typed digits, blanks for remaining
  const raw = number.replace(/\D/g, '');
  const maxLen = network === 'amex' ? 15 : 16;
  const groups = network === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  let pos = 0;
  const displayParts = groups.map(len => {
    const chunk = raw.slice(pos, pos + len);
    const dots = '•'.repeat(Math.min(chunk.length, len));
    const blanks = '_'.repeat(len - dots.length);
    pos += len;
    return dots + blanks;
  });
  const displayNum = displayParts.join(' ');

  return (
    <View style={styles.cardPreview}>
      {/* Subtle circle decorations */}
      <View style={styles.cardCircle1} />
      <View style={styles.cardCircle2} />

      {/* Top row: chip + contactless */}
      <View style={styles.cardTop}>
        <View style={styles.chip} />
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path
            d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M12 6a6 6 0 1 1 0 12A6 6 0 0 1 12 6z"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
            fill="none"
          />
          <Circle cx={12} cy={12} r={2} fill="rgba(255,255,255,0.4)" />
        </Svg>
      </View>

      {/* Card number */}
      <Text style={styles.cardNumber}>{displayNum}</Text>

      {/* Bottom row */}
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
          <Text style={styles.cardFieldValue}>
            {name || 'Joseph Israel'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardFieldLabel}>EXPIRES</Text>
          <Text style={styles.cardFieldValue}>
            {expiry || 'MM/YY'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Expiry Formatter ─────────────────────────────────────────────────────────

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddCardScreen() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [holderName, setHolderName] = useState('');
  const [saveCard, setSaveCard]     = useState(true);
  const [cvvVisible, setCvvVisible] = useState(false);

  const network = detectNetwork(cardNumber);
  const maxDigits = network === 'amex' ? 15 : 16;
  const maxCvv    = network === 'amex' ? 4 : 3;

  const handleCardNumber = useCallback((text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, maxDigits);
    const net = detectNetwork(raw);
    setCardNumber(formatCardNumber(raw, net));
  }, [maxDigits]);

  const handleExpiry = useCallback((text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    setExpiry(formatExpiry(raw));
  }, []);

  const handleCvv = useCallback((text: string) => {
    setCvv(text.replace(/\D/g, '').slice(0, maxCvv));
  }, [maxCvv]);

  const rawDigits  = cardNumber.replace(/\D/g, '');
  const canSubmit  =
    rawDigits.length === maxDigits &&
    expiry.replace(/\D/g, '').length === 4 &&
    cvv.length === maxCvv &&
    holderName.trim().length >= 2;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#555" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Add payment card</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Card Preview ── */}
          <CardPreview
            number={cardNumber}
            name={holderName}
            expiry={expiry}
            network={network}
          />

          {/* ── Card Number ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CARD NUMBER</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldIcon}>💳</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#CCCCCC"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={handleCardNumber}
                maxLength={network === 'amex' ? 17 : 19}
                returnKeyType="next"
              />
              {/* Live network logo — updates as user types */}
              <CardNetworkLogo network={network} width={36} height={22} />
            </View>
            {/* Network name hint */}
            {network !== 'unknown' && (
              <Text style={styles.networkHint}>
                {network === 'visa'       && '✓ Visa detected'}
                {network === 'mastercard' && '✓ Mastercard detected'}
                {network === 'verve'      && '✓ Verve detected'}
                {network === 'amex'       && '✓ American Express detected'}
              </Text>
            )}
          </View>

          {/* ── Expiry + CVV ── */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>EXPIRY</Text>
              <View style={styles.fieldBox}>
                <TextInput
                  style={[styles.fieldInput, { textAlign: 'center' }]}
                  placeholder="MM / YY"
                  placeholderTextColor="#CCCCCC"
                  keyboardType="number-pad"
                  value={expiry}
                  onChangeText={handleExpiry}
                  maxLength={7}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>CVV</Text>
              <View style={styles.fieldBox}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder={'•'.repeat(maxCvv)}
                  placeholderTextColor="#CCCCCC"
                  keyboardType="number-pad"
                  value={cvv}
                  onChangeText={handleCvv}
                  maxLength={maxCvv}
                  secureTextEntry={!cvvVisible}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setCvvVisible(v => !v)} activeOpacity={0.7}>
                  <Text style={styles.fieldIcon}>{cvvVisible ? '🙈' : '❓'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Cardholder Name ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
            <View style={styles.fieldBox}>
              <TextInput
                style={styles.fieldInput}
                placeholder="As on card"
                placeholderTextColor="#CCCCCC"
                autoCapitalize="characters"
                value={holderName}
                onChangeText={setHolderName}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Save card toggle ── */}
          <View style={styles.saveRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saveLbl}>Save card for future payments</Text>
              <Text style={styles.saveSub}>Encrypted & PCI DSS compliant</Text>
            </View>
            <Switch
              value={saveCard}
              onValueChange={setSaveCard}
              trackColor={{ false: '#E0E0E0', true: '#0F2419' }}
              thumbColor={saveCard ? '#fff' : '#BBBBBB'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            disabled={!canSubmit}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Text style={[styles.ctaTxt, !canSubmit && styles.ctaTxtDisabled]}>
              Add card
            </Text>
          </TouchableOpacity>

          {/* ── Security footer ── */}
          <View style={styles.secFooter}>
            <Text style={styles.secTxt}>🔒  256-bit SSL · PCI DSS Level 1 · CBN licensed</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 16,
    color: '#555',
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.2,
  },

  scroll: {
    padding: 18,
  },

  // Card preview
  cardPreview: {
    backgroundColor: '#0F2419',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -30,
  },
  cardCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chip: {
    width: 36,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#D4A017',
    opacity: 0.9,
  },
  cardNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 20,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardFieldLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  cardFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },

  // Form fields
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 0,
    gap: 10,
    minHeight: 50,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A0A0A',
    padding: 0,
  },
  fieldIcon: {
    fontSize: 16,
  },
  networkHint: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 2,
  },

  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },

  // Save toggle row
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  saveLbl: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  saveSub: {
    fontSize: 11,
    color: '#AAAAAA',
  },

  // CTA
  cta: {
    backgroundColor: '#0F2419',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaDisabled: {
    backgroundColor: '#E8E8E8',
  },
  ctaTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  ctaTxtDisabled: {
    color: '#BBBBBB',
  },

  // Security footer
  secFooter: {
    alignItems: 'center',
    paddingTop: 4,
  },
  secTxt: {
    fontSize: 11,
    color: '#CCCCCC',
  },
});