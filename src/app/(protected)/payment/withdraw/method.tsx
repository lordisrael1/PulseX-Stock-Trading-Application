/**
 * WithdrawMethodScreen.tsx
 * Step 2 of 3 — Withdraw flow
 * Matches 000.png exactly:
 *   - "Choose payout method" header with ₦20,000 pill
 *   - Step bar: Amount ✓ → Method (active) → Confirm
 *   - 2-card grid: Nigerian bank (active) | USD account (disabled/coming soon)
 *   - Withdrawal info panel (NIBSS details)
 *   - CBN regulated · NDIC insured footer
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AMOUNT = 20_000;

function parseAmountParam(amount?: string | string[]) {
  const value = Array.isArray(amount) ? amount[0] : amount;
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_AMOUNT;
}

function fmtAmount(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar() {
  return (
    <View style={styles.stepRow}>
      {/* Step 1 — done */}
      <View style={styles.stepItem}>
        <View style={[styles.dot, styles.dotDone]}>
          <Text style={styles.dotTxtWhite}>✓</Text>
        </View>
        <Text style={[styles.stepLbl, styles.stepLblOn]}>Amount</Text>
      </View>

      <View style={[styles.stepLine, styles.stepLineDone]} />

      {/* Step 2 — active */}
      <View style={styles.stepItem}>
        <View style={[styles.dot, styles.dotActive]}>
          <Text style={styles.dotTxtWhite}>2</Text>
        </View>
        <Text style={[styles.stepLbl, styles.stepLblOn]}>Method</Text>
      </View>

      <View style={styles.stepLine} />

      {/* Step 3 — idle */}
      <View style={styles.stepItem}>
        <View style={styles.dot}>
          <Text style={styles.dotTxtGray}>3</Text>
        </View>
        <Text style={styles.stepLbl}>Confirm</Text>
      </View>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WithdrawMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const amount = parseAmountParam(params.amount);
  const amountFmt = fmtAmount(amount);

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
          <ArrowLeft size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.topTitle}>Choose payout method</Text>
          <Text style={styles.topSub}>Step 2 of 3</Text>
        </View>
        <View style={styles.amtPill}>
          <Text style={styles.amtPillTxt}>{amountFmt}</Text>
        </View>
      </View>

      {/* ── Step bar ── */}
      <View style={styles.stepWrap}>
        <StepBar />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section label ── */}
        <Text style={styles.sectionLbl}>WHERE SHOULD WE SEND IT?</Text>

        {/* ── Method Cards ── */}
        <View style={styles.grid}>
          {/* Nigerian Bank — active/selectable */}
          <TouchableOpacity
            style={[styles.mCard, styles.mCardActive]}
            activeOpacity={0.75}
            onPress={() =>
              router.push({
                pathname: '/payment/withdraw/bank-select',
                params: { amount: String(amount) },
              })
            }
          >
            <View style={[styles.mCardIcon, styles.mCardIconActive]}>
              <Text style={{ fontSize: 22 }}>🏦</Text>
            </View>
            <Text style={styles.mCardTitle}>Nigerian bank</Text>
            <Text style={styles.mCardSub}>NGX member banks</Text>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeBlueTxt}>~10 min</Text>
            </View>
          </TouchableOpacity>

          {/* USD Account — disabled / coming soon */}
          <View style={[styles.mCard, styles.mCardDisabled]}>
            <View style={[styles.mCardIcon, styles.mCardIconDisabled]}>
              <Text style={{ fontSize: 22, opacity: 0.4 }}>₦</Text>
            </View>
            <Text style={[styles.mCardTitle, { color: '#AAAAAA' }]}>
              USD account
            </Text>
            <Text style={[styles.mCardSub, { color: '#CCCCCC' }]}>
              Coming soon
            </Text>
            <View style={styles.badgeSoon}>
              <Text style={styles.badgeSoonTxt}>Soon</Text>
            </View>
          </View>
        </View>

        {/* ── Withdrawal info panel ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHead}>
            <View style={styles.infoIconWrap}>
              <Info size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoCardTitle}>Withdrawal info</Text>
              <Text style={styles.infoCardSub}>
                Processed via NIBSS Instant Payments
              </Text>
            </View>
          </View>

          <View style={styles.infoBody}>
            <InfoRow label="Processing time" value="~10 minutes" />
            <InfoRow label="Fee"              value="₦52.50 (NIP charge)" />
            <InfoRow label="Daily limit"      value="₦5,000,000" />
            <InfoRow label="Min withdrawal"   value="₦500" />
            <InfoRow label="Network"          value="NIBSS / NIP" />
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerTxt}>
            🔒  CBN regulated · NDIC insured
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 16, color: '#555' },
  titleWrap: { flex: 1 },
  topTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.3,
  },
  topSub: { fontSize: 11, color: '#BBBBBB', marginTop: 1 },
  amtPill: {
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  amtPillTxt: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },

  // Step bar
  stepWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: '#113322', borderColor: '#113322' },
  dotActive: {
    backgroundColor: '#113322',
    borderColor: '#113322',
  },
  dotTxtWhite: { fontSize: 9, fontWeight: '800', color: '#fff' },
  dotTxtGray:  { fontSize: 9, fontWeight: '800', color: '#AAAAAA' },
  stepLbl:   { fontSize: 10, fontWeight: '700', color: '#CCCCCC' },
  stepLblOn: { color: '#113322' },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 5,
  },
  stepLineDone: { backgroundColor: '#113322' },

  // Body
  scroll: { padding: 18 },
  sectionLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BBBBBB',
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  // Method grid
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 14,
  },
  mCardActive: {
    borderColor: '#EBEBEB',
  },
  mCardDisabled: {
    opacity: 0.6,
  },
  mCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mCardIconActive: {
    backgroundColor: '#F0F0F0',
  },
  mCardIconDisabled: {
    backgroundColor: '#F5F5F5',
  },
  mCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0A',
    marginBottom: 3,
  },
  mCardSub: {
    fontSize: 11,
    color: '#AAAAAA',
    marginBottom: 8,
    lineHeight: 15,
  },
  badgeBlue: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0FB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeBlueTxt: { fontSize: 11, fontWeight: '700', color: '#0C447C' },
  badgeSoon: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9EC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSoonTxt: { fontSize: 11, fontWeight: '700', color: '#B45309' },

  // Info card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  infoCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  infoCardSub: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 1,
  },
  infoBody: { paddingHorizontal: 16, paddingVertical: 6 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F8F8F8',
  },
  infoLabel: { fontSize: 12, color: '#AAAAAA' },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#0A0A0A' },

  // Footer
  footer: { alignItems: 'center', paddingTop: 4 },
  footerTxt: { fontSize: 11, color: '#CCCCCC' },
});
