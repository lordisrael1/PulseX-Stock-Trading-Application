/**
 * ConfirmPaymentScreen.tsx
 * Step 3 of 3 — Review and confirm wallet funding.
 * Processing fee = 1% of amount (capped at ₦2,000, waived below ₦100).
 */


import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankAccount {
  name: string;
  abbr: string;
  color: string;
  last4: string;
}

interface Props {
  amount?: number;
  bank?: BankAccount;
}

// ─── Fee logic ────────────────────────────────────────────────────────────────

function calcFee(amount: number): number {
  if (amount < 100) return 0;
  const fee = amount * 0.01;
  return Math.min(fee, 2000); // capped at ₦2,000
}

function fmt(n: number): string {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6l2.5 2.5L9.5 3.5"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// function StepBar() {
//   const steps = ['Amount', 'Method', 'Confirm'];
//   return (
//     <View style={sb.row}>
//       {steps.map((label, i) => {
//         const done = i < 2;
//         const active = i === 2;
//         return (
//           <View key={label} style={sb.stepWrap}>
//             {i > 0 && (
//               <View style={[sb.connector, (done || active) && sb.connectorDark]} />
//             )}
//             <View style={[
//               sb.circle,
//               done && sb.circleDone,
//               active && sb.circleActive,
//               !done && !active && sb.circleFuture,
//             ]}>
//               {done
//                 ? <CheckIcon size={11} />
//                 : <Text style={[sb.circleNum, active && sb.circleNumActive]}>{i + 1}</Text>
//               }
//             </View>
//             <Text style={[sb.label, active && sb.labelActive]}>{label}</Text>
//           </View>
//         );
//       })}
//     </View>
//   );
// }

function StepBar() {
    return (
        <View style={styles.stepRow}>
            {/* Step 1 — done */}
            <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDone]}>
                    <Text style={styles.stepDotTxtDone}>✓</Text>
                </View>
                <Text style={[styles.stepLbl, styles.stepLblDone]}>Amount</Text>
            </View>

            {/* Line */}
            <View style={[styles.stepLine, styles.stepLineDone]} />

            {/* Step 2 — active */}
            <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDone]}>
                    <Text style={styles.stepDotTxtDone}>✓</Text>
                </View>
                <Text style={[styles.stepLbl, styles.stepLblDone]}>Method</Text>
            </View>

            {/* <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepActive]}>
                    <Text style={styles.stepDotTxtDone}>2</Text>
                </View>
                <Text style={[styles.stepLbl, styles.stepLblDone]}>Method</Text>
            </View> */}

            {/* Line */}
            <View style={styles.stepLine} />

            {/* Step 3 — idle */}
            <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepActive]}>
                    <Text style={styles.stepDotTxtDone}>3</Text>
                </View>
                <Text style={[styles.stepLbl, styles.stepLblDone]}>Confirm</Text>
            </View>

            {/* <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                    <Text style={styles.stepDotTxt}>3</Text>
                </View>
                <Text style={styles.stepLbl}>Confirm</Text>
            </View> */}
        </View>
    );
}


function Header({
    title,
    sub,
    onBack,
    amountFmt,
}: {
    title: string;
    sub: string;
    onBack: () => void;
    amountFmt: string;
}) {
    return (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                    <ArrowLeft size={18} color="#555" />
                </TouchableOpacity>
                <View style={styles.headerMid}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSub}>{sub}</Text>
                </View>
                <View style={styles.amtPill}>
                    <Text style={styles.amtPillTxt}>{amountFmt}</Text>
                </View>
            </View>
            <StepBar />
        </View>
    );
}


const sb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connector: {
    flex: 1,
    height: 1.5,
    width: 32,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  connectorDark: { backgroundColor: '#111' },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: '#111' },
  circleActive: { backgroundColor: '#111' },
  circleFuture: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#CCC' },
  circleNum: { fontSize: 10, fontWeight: '700', color: '#AAA' },
  circleNumActive: { color: '#fff' },
  label: { fontSize: 11, color: '#AAA' },
  labelActive: { color: '#111', fontWeight: '600' },
});

function SummaryRow({
  label,
  value,
  valueColor,
  bold,
  children,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  bold?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryKey, bold && { color: '#111', fontWeight: '700' }]}>
        {label}
      </Text>
      {children ?? (
        <Text style={[styles.summaryVal, bold && styles.summaryValBold, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      )}
    </View>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipTxt, { color }]}>{label}</Text>
    </View>
  );
}



const DEFAULT_AMOUNT = 50_000;
function fmtAmount(n: number) {
    return `₦${n.toLocaleString('en-NG')}`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ConfirmPaymentScreen({
  //amount = 10000,
  bank = { name: 'Guaranty Trust Bank', abbr: 'GTB', color: '#E8521A', last4: '4412' },
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams<{ amount?: string }>();

  const amount = Number.isFinite(Number(params.amount))
        ? Math.max(0, parseInt(params.amount ?? '', 10))
        : DEFAULT_AMOUNT;

  const fee = calcFee(amount);
  const total = amount + fee;
  const feeLabel = fee === 0 ? 'Free' : `₦${fmt(fee)}`;
  const freeFlag = fee === 0;

  const handlePay = () => {
    setLoading(true);
    // Simulate network call
    setTimeout(() => {
      setLoading(false);
      router.replace('/payment/deposit/success' as any);
    }, 1800);
  };

  
  const amountFmt = fmt(amount);


    const handleBack = () => {
            router.back();
    };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header title= "Choose payment method" sub="'Step 3 of 3" onBack={handleBack} amountFmt={amountFmt} />

      {/* ── Header ── */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path d="M10 3L5 8l5 5" stroke="#111" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Confirm payment</Text>
          <Text style={styles.headerSub}>Step 3 of 3</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountBadgeTxt}>₦{fmt(amount)}</Text>
        </View>
      </View> */}

      {/* ── Steps ── */}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Amount hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>YOU'RE FUNDING</Text>
          <Text style={styles.heroAmount}>
            <Text style={styles.heroCurrency}>₦</Text>
            {fmt(amount).split('.')[0]}
            <Text style={styles.heroDecimals}>.{fmt(amount).split('.')[1]}</Text>
          </Text>
          <Text style={styles.heroSub}>
            to your <Text style={styles.heroSubBold}>PulseX Wallet</Text>
          </Text>
        </View>

        {/* ── Transaction summary ── */}
        <Text style={styles.sectionLabel}>TRANSACTION SUMMARY</Text>
        <View style={styles.card}>
          <SummaryRow label="Amount" value={`₦${fmt(amount)}`} />
          <View style={styles.divider} />
          <SummaryRow label="Processing fee (1%)">
            <View style={styles.feeRight}>
              <Text style={[styles.summaryVal, freeFlag ? { color: '#16A34A' } : null]}>
                {feeLabel}
              </Text>
              <Chip
                label={freeFlag ? 'Waived' : 'Instant'}
                color={freeFlag ? '#16A34A' : '#2563EB'}
                bg={freeFlag ? '#F0FDF4' : '#EFF6FF'}
              />
            </View>
          </SummaryRow>
          <View style={styles.dashedDivider} />
          <SummaryRow label="Total charged" value={`₦${fmt(total)}`} bold />
        </View>

        {/* ── Paying with ── */}
        <Text style={styles.sectionLabel}>PAYING WITH</Text>
        <View style={styles.card}>

          <View style={styles.summaryRow}>
            <View style={styles.summaryKey2}>
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Rect x={1} y={3} width={14} height={10} rx={2} stroke="#888" strokeWidth={1.3} />
                <Path d="M1 6h14" stroke="#888" strokeWidth={1.3} />
                <Rect x={3} y={9} width={4} height={1.5} rx={0.5} fill="#888" />
              </Svg>
              <Text style={styles.summaryKeyTxt}>Bank account</Text>
            </View>
            <View style={styles.bankRight}>
              <View>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankAcct}>.... {bank.last4}</Text>
              </View>
              <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
                <Text style={styles.bankLogoTxt}>{bank.abbr}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Arrival</Text>
            <View style={styles.feeRight}>
              <Text style={styles.summaryVal}>Instant</Text>
              <Chip label="0 min" color="#2563EB" bg="#EFF6FF" />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Reference</Text>
            <Text style={styles.refVal}>PXW-20241038-7K2M</Text>
          </View>
        </View>

        {/* ── Warning ── */}
        <View style={styles.warning}>
          <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <Path d="M9 1.5L16.5 15.5H1.5L9 1.5Z" stroke="#D97706" strokeWidth={1.4} strokeLinejoin="round" />
            <Path d="M9 7v3.5" stroke="#D97706" strokeWidth={1.5} strokeLinecap="round" />
            <Circle cx={9} cy={13} r={0.8} fill="#D97706" />
          </Svg>
          <Text style={styles.warningTxt}>
            <Text style={styles.warningBold}>Double-check your details. </Text>
            Once confirmed, this transaction cannot be reversed. Funds arrive in your PulseX wallet instantly.
          </Text>
        </View>

        {/* ── Security strip ── */}
        <View style={styles.security}>
          <Svg width={11} height={13} viewBox="0 0 11 13" fill="none">
            <Path d="M5.5 1L1 3v3.5C1 9.2 3 11.5 5.5 12 8 11.5 10 9.2 10 6.5V3L5.5 1Z" stroke="#AAA" strokeWidth={1.2} strokeLinejoin="round" />
            <Path d="M3.5 6.5l1.5 1.5 2.5-2.5" stroke="#AAA" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.securityTxt}>256-bit SSL</Text>
          <View style={styles.secDot} />
          <Text style={styles.securityTxt}>PCI DSS Level 1</Text>
          <View style={styles.secDot} />
          <Text style={styles.securityTxt}>CBN licensed</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── CTAs ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnLoading]}
          onPress={handlePay}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Path d="M3 8.5l3.5 3.5L13 4.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.ctaTxt}>Pay ₦{fmt(total)}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.6}>
          <Text style={styles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  // header: {
  //   backgroundColor: '#fff',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   gap: 10,
  //   borderBottomWidth: 0.5,
  //   borderBottomColor: '#EFEFEF',
  // },
  // backBtn: {
  //   width: 32, height: 32,
  //   borderRadius: 16,
  //   backgroundColor: '#F5F5F5',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // headerCenter: { flex: 1, alignItems: 'center' },
  // headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  // headerSub: { fontSize: 11, color: '#888', marginTop: 1 },
  // amountBadge: {
  //   backgroundColor: '#F5F5F5',
  //   borderRadius: 20,
  //   paddingHorizontal: 12,
  //   paddingVertical: 5,
  // },
  // amountBadgeTxt: { fontSize: 13, fontWeight: '700', color: '#111' },

  header: {
        backgroundColor: '#fff',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEEEEE',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
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
    headerMid: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0A0A0A',
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: 11,
        color: '#BBBBBB',
        marginTop: 1,
    },
    amtPill: {
        backgroundColor: '#F2F2F2',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    amtPillTxt: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0A0A0A',
    },

   // ── Step bar
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 14,
        gap: 0,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    stepDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepDone: {
        backgroundColor: '#113322',
        borderColor: '#113322',
    },
    stepActive: {
        backgroundColor: '#113322',
        borderColor: '#113322',
    },
    stepDotTxt: {
        fontSize: 9,
        fontWeight: '800',
        color: '#AAAAAA',
    },
    stepDotTxtDone: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
    },
    stepLbl: {
        fontSize: 10,
        fontWeight: '700',
        color: '#CCCCCC',
    },
    stepLblDone: {
        color: '#113322',
    },
    stepLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E8E8',
        marginHorizontal: 6,
    },
    stepLineDone: {
        backgroundColor: '#113322',
    },

  // Scroll
  scroll: { paddingBottom: 8 },

  // Hero
  hero: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#EFEFEF',
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -1,
    lineHeight: 48,
  },
  heroCurrency: { fontSize: 28, fontWeight: '600', opacity: 0.5 },
  heroDecimals: { fontSize: 26, fontWeight: '600', opacity: 0.45 },
  heroSub: { fontSize: 13, color: '#888', marginTop: 8 },
  heroSubBold: { color: '#111', fontWeight: '700' },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  summaryKey: { fontSize: 13, color: '#888' },
  summaryKey2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryKeyTxt: { fontSize: 13, color: '#888' },
  summaryVal: { fontSize: 13, fontWeight: '600', color: '#111' },
  summaryValBold: { fontSize: 15, fontWeight: '800', color: '#111' },

  feeRight: { alignItems: 'flex-end', gap: 4 },

  divider: { height: 0.5, backgroundColor: '#F0F0F0', marginHorizontal: 0 },
  dashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    marginHorizontal: 18,
    marginVertical: 2,
  },

  // Chip
  chip: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipTxt: { fontSize: 11, fontWeight: '600' },

  // Bank
  bankRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankName: { fontSize: 13, fontWeight: '600', color: '#111', textAlign: 'right' },
  bankAcct: { fontSize: 11, color: '#AAA', textAlign: 'right', marginTop: 2 },
  bankLogo: {
    width: 30, height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoTxt: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  refVal: { fontSize: 12, fontWeight: '600', color: '#555', letterSpacing: 0.4 },

  // Warning
  warning: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  warningTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  warningBold: { fontWeight: '700' },

  // Security
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
    paddingBottom: 4,
  },
  securityTxt: { fontSize: 11, color: '#AAA' },
  secDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CCC' },

  // CTAs
  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 0.5,
    borderTopColor: '#EBEBEB',
  },
  ctaBtn: {
    backgroundColor: '#111',
    borderRadius: 100,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnLoading: { opacity: 0.7 },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelTxt: { fontSize: 14, color: '#888' },
});