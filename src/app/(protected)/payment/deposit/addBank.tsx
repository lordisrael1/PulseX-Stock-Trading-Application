/**
 * WithdrawBankSelectScreen.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Withdraw Step 2b — Select Nigerian bank + enter account number
 *
 * ACCOUNT NAME VERIFICATION (NIBSS Name Enquiry):
 * ─────────────────────────────────────────────────────────────────────
 * Real API: Paystack's resolve endpoint
 *   GET https://api.paystack.co/bank/resolve
 *       ?account_number=XXXXXXXXXX&bank_code=XXX
 *   Headers: { Authorization: 'Bearer sk_live_...' }
 *   Returns: { data: { account_name: 'JOSEPH ISRAEL MOJOLAOLUWA' } }
 *
 * ⚠️  NEVER call Paystack directly from the app — your secret key
 *   would be extractable from the APK/IPA.
 *   Route it through YOUR backend:
 *     App → POST /api/verify-account → your server → Paystack → name
 *
 * Set USE_REAL_API = true and point BACKEND_URL at your server
 * once your backend endpoint is live. Until then, the mock simulates
 * a realistic 1.2s delay + name lookup.
 *
 * WARNING:
 *   The verified account name is checked against the user's PulseX
 *   profile name. A mismatch shows a warning (not a hard block —
 *   same as Cowrywise/Piggyvest behaviour).
 * ─────────────────────────────────────────────────────────────────────
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, ChevronDown, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBankAccountStore, type SavedBankAccount } from '../../../../store/useBankAccountStore';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Config ───────────────────────────────────────────────────────────────────

const USE_REAL_API  = false;               // flip to true once backend is live
const BACKEND_URL   = 'https://your-api.pulsex.io/verify-account';

// The logged-in user's full name — in production, pull from your auth store
const PULSEX_ACCOUNT_NAME = 'JOSEPH ISRAEL MOJOLAOLUWA';

const DEFAULT_AMOUNT = 20_000;

function parseAmountParam(amount?: string | string[]) {
  const value = Array.isArray(amount) ? amount[0] : amount;
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_AMOUNT;
}

function fmtAmount(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

// ─── Nigerian Banks (CBN-licensed, with Paystack bank codes) ─────────────────
// Bank codes sourced from: https://api.paystack.co/bank?country=nigeria

const NG_BANKS = [
  { name: 'Access Bank',          code: '044', color: '#003B6F', short: 'ACC' },
  { name: 'Citibank Nigeria',      code: '023', color: '#003087', short: 'CTB' },
  { name: 'Ecobank Nigeria',       code: '050', color: '#00A0A0', short: 'ECO' },
  { name: 'Fidelity Bank',         code: '070', color: '#006400', short: 'FDL' },
  { name: 'First Bank of Nigeria', code: '011', color: '#003B6F', short: 'FBN' },
  { name: 'FCMB',                  code: '214', color: '#8B0000', short: 'FCM' },
  { name: 'Guaranty Trust Bank',   code: '058', color: '#E86000', short: 'GTB' },
  { name: 'Heritage Bank',         code: '030', color: '#7B3F00', short: 'HRB' },
  { name: 'Keystone Bank',         code: '082', color: '#006400', short: 'KEY' },
  { name: 'Kuda Bank',             code: '50211', color: '#5B30A6', short: 'KDA' },
  { name: 'Moniepoint',            code: '50515', color: '#00875A', short: 'MNP' },
  { name: 'OPay',                  code: '999992', color: '#1A9E4A', short: 'OPY' },
  { name: 'PalmPay',               code: '999991', color: '#1DB954', short: 'PLM' },
  { name: 'Polaris Bank',          code: '076', color: '#C00000', short: 'POL' },
  { name: 'Providus Bank',         code: '101', color: '#001F5B', short: 'PRV' },
  { name: 'Stanbic IBTC',          code: '221', color: '#0033A0', short: 'SIB' },
  { name: 'Standard Chartered',    code: '068', color: '#00847F', short: 'SCB' },
  { name: 'Sterling Bank',         code: '232', color: '#00527A', short: 'STL' },
  { name: 'UBA',                   code: '033', color: '#C8102E', short: 'UBA' },
  { name: 'Union Bank',            code: '032', color: '#2C3E8C', short: 'UNB' },
  { name: 'Unity Bank',            code: '215', color: '#004C97', short: 'UTB' },
  { name: 'VFD Microfinance',      code: '566', color: '#2D2D2D', short: 'VFD' },
  { name: 'Wema Bank',             code: '035', color: '#9B1B30', short: 'WEM' },
  { name: 'Zenith Bank',           code: '057', color: '#C1121F', short: 'ZEN' },
];

type Bank = typeof NG_BANKS[0];

// ─── Mock account name lookup (simulates NIBSS response) ─────────────────────
// In production, replace with a real backend call (see BACKEND_URL above)

const MOCK_ACCOUNTS: Record<string, string> = {
  '0123456789': 'JOSEPH ISRAEL MOJOLAOLUWA',
  '0987654321': 'ADAEZE CHIOMA OKAFOR',
  '1234567890': 'EMEKA CHUKWUEMEKA OBI',
  '9876543210': 'FATIMA ABUBAKAR IBRAHIM',
  '1029067800': 'JOSEPH ISRAEL MOJOLAOLUWA',
  '0000000000': 'JOHN DOE TEST',
};

async function resolveAccountName(
  accountNumber: string,
  bankCode: string,
): Promise<string | null> {
  if (USE_REAL_API) {
    // ── Real path: call your backend ──────────────────────────────────
    // Your backend then calls:
    //   GET https://api.paystack.co/bank/resolve
    //       ?account_number=${accountNumber}&bank_code=${bankCode}
    //   Authorization: Bearer sk_live_XXXX
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.account_name ?? null;
  }

  // ── Mock path: simulate 1.2s NIBSS roundtrip ─────────────────────
  await new Promise(r => setTimeout(r, 1200));

  // Last 10 digits used as key for demo consistency
  const key = accountNumber.slice(-10).padStart(10, '0');
  return MOCK_ACCOUNTS[key] ?? null;
}

// ─── Name match check ─────────────────────────────────────────────────────────
// Fuzzy: any two consecutive words from the account name match PulseX name

function namesMatch(resolved: string, pulsex: string): boolean {
  const rWords = resolved.toUpperCase().split(/\s+/);
  const pWords = pulsex.toUpperCase().split(/\s+/);
  let matches = 0;
  for (const w of rWords) {
    if (pWords.includes(w)) matches++;
  }
  return matches >= 2;
}

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar() {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepItem}>
        <View style={[styles.dot, styles.dotDone]}>
          <Text style={styles.dotTxt}>✓</Text>
        </View>
        <Text style={[styles.stepLbl, styles.stepOn]}>Amount</Text>
      </View>
      <View style={[styles.stepLine, styles.stepLineDone]} />
      <View style={styles.stepItem}>
        <View style={[styles.dot, styles.dotActive]}>
          <Text style={styles.dotTxt}>2</Text>
        </View>
        <Text style={[styles.stepLbl, styles.stepOn]}>Method</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepItem}>
        <View style={styles.dot}>
          <Text style={[styles.dotTxt, { color: '#AAAAAA' }]}>3</Text>
        </View>
        <Text style={styles.stepLbl}>Confirm</Text>
      </View>
    </View>
  );
}

// ─── Bank Picker Modal ────────────────────────────────────────────────────────

function BankPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Bank | null;
  onSelect: (b: Bank) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = NG_BANKS.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.pickerRoot}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select bank</Text>
          <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
            <X size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={16} color="#AAAAAA" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            placeholderTextColor="#CCCCCC"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={14} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={b => b.code}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = selected?.code === item.code;
            return (
              <TouchableOpacity
                style={[styles.bankItem, isSelected && styles.bankItemSel]}
                onPress={() => { onSelect(item); onClose(); setQuery(''); }}
                activeOpacity={0.7}
              >
                <View style={[styles.bankLogo, { backgroundColor: item.color }]}>
                  <Text style={styles.bankLogoTxt}>{item.short}</Text>
                </View>
                <View style={styles.bankItemInfo}>
                  <Text style={styles.bankItemName}>{item.name}</Text>
                  <Text style={styles.bankItemCode}>Bank code: {item.code}</Text>
                </View>
                {isSelected && (
                  <CheckCircle size={18} color="#113322" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type VerifyState = 'idle' | 'loading' | 'verified' | 'not_found' | 'error';

export default function WithdrawBankSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();
  const amount = parseAmountParam(params.amount);
  const amountFmt = fmtAmount(amount);

  const [bank, setBank]           = useState<Bank | null>(null);
  const [acctNum, setAcctNum]     = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [nameMatches, setNameMatches]   = useState<boolean | null>(null);

  // Shake animation for mismatch warning
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Auto-trigger verify when 10 digits are entered AND a bank is selected
  useEffect(() => {
    const raw = acctNum.replace(/\D/g, '');
    if (raw.length === 10 && bank) {
      verify(raw, bank.code);
    } else {
      // Reset on edit
      setVerifyState('idle');
      setResolvedName(null);
      setNameMatches(null);
    }
  }, [acctNum, bank]);

  const verify = async (number: string, code: string) => {
    setVerifyState('loading');
    setResolvedName(null);
    setNameMatches(null);
    try {
      const name = await resolveAccountName(number, code);
      if (!name) {
        setVerifyState('not_found');
        return;
      }
      setResolvedName(name);
      const match = namesMatch(name, PULSEX_ACCOUNT_NAME);
      setNameMatches(match);
      setVerifyState('verified');
      if (!match) triggerShake();
    } catch {
      setVerifyState('error');
    }
  };

  const handleAcctInput = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 10);
    setAcctNum(raw);
  };

  const addAccount = useBankAccountStore((s) => s.addAccount);

  const canContinue =
    verifyState === 'verified' &&
    resolvedName !== null &&
    bank !== null;

  const handleSaveAndContinue = () => {
    if (!bank || !resolvedName) return;
    const newAccount: SavedBankAccount = {
      id: `${bank.code}-${acctNum}`,
      bankName: bank.name,
      bankCode: bank.code,
      bankColor: bank.color,
      bankShort: bank.short,
      accountNumber: acctNum,
      accountName: resolvedName,
    };
    addAccount(newAccount);
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.topTitle}>Add bank account</Text>
          <Text style={styles.topSub}>Step 2 of 3</Text>
        </View>
        {/* <View style={styles.amtPill}>
          <Text style={styles.amtPillTxt}>{amountFmt}</Text>
        </View> */}
      </View>

      {/* ── Step bar ── */}
      <View style={styles.stepWrap}>
        <StepBar />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.body}>

              {/* ── Bank selector ── */}
              <Text style={styles.fieldLbl}>BANK</Text>
              <TouchableOpacity
                style={styles.bankTrigger}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.75}
              >
                {bank ? (
                  <>
                    <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
                      <Text style={styles.bankLogoTxt}>{bank.short}</Text>
                    </View>
                    <Text style={styles.bankTriggerName}>{bank.name}</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.bankLogo, { backgroundColor: '#E8E8E8' }]}>
                      <Text style={[styles.bankLogoTxt, { color: '#AAAAAA' }]}>BNK</Text>
                    </View>
                    <Text style={styles.bankTriggerPlaceholder}>Select bank</Text>
                  </>
                )}
                <ChevronDown size={16} color="#AAAAAA" />
              </TouchableOpacity>

              {/* ── Account number ── */}
              <Text style={[styles.fieldLbl, { marginTop: 16 }]}>ACCOUNT NUMBER</Text>
              <View style={[
                styles.acctBox,
                acctNum.length === 10 && styles.acctBoxFilled,
                verifyState === 'not_found' && styles.acctBoxError,
              ]}>
                <TextInput
                  style={styles.acctInput}
                  placeholder="0000000000"
                  placeholderTextColor="#CCCCCC"
                  keyboardType="number-pad"
                  value={acctNum}
                  onChangeText={handleAcctInput}
                  maxLength={10}
                  returnKeyType="done"
                />
                {verifyState === 'loading' && (
                  <ActivityIndicator size="small" color="#113322" />
                )}
                {verifyState === 'verified' && (
                  <CheckCircle size={18} color="#22C55E" />
                )}
                {verifyState === 'not_found' && (
                  <Text style={{ fontSize: 16 }}>❌</Text>
                )}
              </View>
              <Text style={styles.acctHint}>
                {acctNum.length}/10 digits
                {!bank && acctNum.length > 0 ? '  ·  Select a bank first' : ''}
              </Text>

              {/* ── Verified name strip ── */}
              {verifyState === 'verified' && resolvedName && (
                <Animated.View
                  style={[
                    styles.verifiedStrip,
                    !nameMatches && styles.verifiedStripWarn,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  <View style={styles.verifiedLeft}>
                    <Text style={[
                      styles.verifiedLabel,
                      !nameMatches && styles.verifiedLabelWarn,
                    ]}>
                      {nameMatches ? '✓  Account verified' : '⚠  Name mismatch'}
                    </Text>
                    <Text style={[
                      styles.verifiedName,
                      !nameMatches && styles.verifiedNameWarn,
                    ]}>
                      {resolvedName}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* ── Name mismatch warning ── */}
              {verifyState === 'verified' && nameMatches === false && (
                <View style={styles.warnBox}>
                  <Text style={styles.warnTitle}>Account name doesn't match</Text>
                  <Text style={styles.warnBody}>
                    The verified account name{' '}
                    <Text style={styles.warnBold}>{resolvedName}</Text>
                    {' '}doesn't match your PulseX account name{' '}
                    <Text style={styles.warnBold}>{PULSEX_ACCOUNT_NAME}</Text>.
                    {'\n\n'}For your protection, withdrawals must go to accounts
                    in your own name. Please use a bank account registered under
                    your name.
                  </Text>
                </View>
              )}

              {/* ── Not found error ── */}
              {verifyState === 'not_found' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTxt}>
                    Account not found. Check the number and selected bank.
                  </Text>
                </View>
              )}

              {/* ── Network error ── */}
              {verifyState === 'error' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTxt}>
                    Verification failed. Check your connection and try again.
                  </Text>
                  <TouchableOpacity
                    onPress={() => verify(acctNum, bank?.code ?? '')}
                    style={styles.retryBtn}
                  >
                    <Text style={styles.retryTxt}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Info card ── */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>How account verification works</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoStep}>1</Text>
                  <Text style={styles.infoTxt}>
                    We query the NIBSS Instant Payment network for the account holder name
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoStep}>2</Text>
                  <Text style={styles.infoTxt}>
                    The returned name is matched against your PulseX account name
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoStep}>3</Text>
                  <Text style={styles.infoTxt}>
                    Matching accounts proceed to confirmation. Mismatched accounts
                    are blocked to protect you from accidental transfers
                  </Text>
                </View>
              </View>

              {/* ── CTA ── */}
              <TouchableOpacity
                style={[
                  styles.cta,
                  (!canContinue || nameMatches === false) && styles.ctaDisabled,
                ]}
                disabled={!canContinue || nameMatches === false}
                activeOpacity={0.85}
                onPress={handleSaveAndContinue}
              >
                <Text style={[
                  styles.ctaTxt,
                  (!canContinue || nameMatches === false) && styles.ctaTxtDisabled,
                ]}>
                  Confirm account &amp; continue
                </Text>
              </TouchableOpacity>

              <View style={{ height: 60 }} />
            </View>
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {/* ── Bank Picker Modal ── */}
      <BankPickerModal
        visible={pickerOpen}
        selected={bank}
        onSelect={setBank}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 16, color: '#555' },
  titleWrap: { flex: 1 },
  topTitle: { fontSize: 15, fontWeight: '800', color: '#0A0A0A', letterSpacing: -0.3 },
  topSub:   { fontSize: 11, color: '#BBBBBB', marginTop: 1 },
  amtPill:  { backgroundColor: '#F2F2F2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  amtPillTxt: { fontSize: 12, fontWeight: '800', color: '#0A0A0A' },

  // Step bar
  stepWrap: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone:   { backgroundColor: '#113322', borderColor: '#113322' },
  dotActive: { backgroundColor: '#113322', borderColor: '#113322' },
  dotTxt:    { fontSize: 9, fontWeight: '800', color: '#fff' },
  stepLbl:   { fontSize: 10, fontWeight: '700', color: '#CCCCCC' },
  stepOn:    { color: '#113322' },
  stepLine:     { flex: 1, height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 5 },
  stepLineDone: { backgroundColor: '#113322' },

  // Body
  body: { padding: 18 },
  fieldLbl: {
    fontSize: 10, fontWeight: '700', color: '#AAAAAA',
    letterSpacing: 1.4, marginBottom: 8,
  },

  // Bank trigger
  bankTrigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8E8E8',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  bankLogo: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bankLogoTxt: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  bankTriggerName:        { flex: 1, fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  bankTriggerPlaceholder: { flex: 1, fontSize: 14, color: '#CCCCCC' },

  // Account number
  acctBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E8E8E8',
    paddingHorizontal: 14, paddingVertical: 0,
    minHeight: 52, gap: 8,
  },
  acctBoxFilled: { borderColor: '#113322' },
  acctBoxError:  { borderColor: '#DC2626' },
  acctInput: {
    flex: 1, fontSize: 18, fontWeight: '700',
    color: '#0A0A0A', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingVertical: 14,
  },
  acctHint: { fontSize: 11, color: '#CCCCCC', marginTop: 5, marginLeft: 2 },

  // Verified strip
  verifiedStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FBF5', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 12, padding: 12, marginTop: 10,
  },
  verifiedStripWarn: {
    backgroundColor: '#FFFBEB', borderColor: '#FDE68A',
  },
  verifiedLeft: { flex: 1 },
  verifiedLabel: {
    fontSize: 10, fontWeight: '800', color: '#166534',
    letterSpacing: 0.5, marginBottom: 3,
  },
  verifiedLabelWarn: { color: '#92400E' },
  verifiedName: {
    fontSize: 15, fontWeight: '900', color: '#14532D', letterSpacing: 0.2,
  },
  verifiedNameWarn: { color: '#78350F' },

  // Name mismatch warning
  warnBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 12, padding: 14, marginTop: 10,
  },
  warnTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B', marginBottom: 6 },
  warnBody:  { fontSize: 12, color: '#7F1D1D', lineHeight: 18 },
  warnBold:  { fontWeight: '800' },

  // Error box
  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 12, padding: 12, marginTop: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  errorTxt: { fontSize: 12, color: '#991B1B', flex: 1, lineHeight: 17 },
  retryBtn: {
    backgroundColor: '#DC2626', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginLeft: 10,
  },
  retryTxt: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5,
    borderColor: '#EBEBEB', padding: 14, marginTop: 18, marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 12, fontWeight: '800', color: '#0A0A0A',
    marginBottom: 12, letterSpacing: -0.1,
  },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  infoStep: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#E4F2EC', textAlign: 'center', lineHeight: 20,
    fontSize: 10, fontWeight: '800', color: '#113322', flexShrink: 0,
    overflow: 'hidden',
  },
  infoTxt: { flex: 1, fontSize: 12, color: '#888', lineHeight: 17 },

  // CTA
  cta: {
    backgroundColor: '#0F2419', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: '#E8E8E8' },
  ctaTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  ctaTxtDisabled: { color: '#BBBBBB' },

  // ── Bank Picker Modal ──
  pickerRoot: { flex: 1, backgroundColor: '#fff' },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#0A0A0A' },
  pickerClose: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#F5F5F5', borderRadius: 12, gap: 8,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#0A0A0A',
    padding: 0,
  },
  bankItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 0.5, borderBottomColor: '#F8F8F8', gap: 12,
  },
  bankItemSel: { backgroundColor: '#F5FBF8' },
  bankItemInfo: { flex: 1 },
  bankItemName: { fontSize: 13, fontWeight: '700', color: '#0A0A0A' },
  bankItemCode: { fontSize: 10, color: '#AAAAAA', marginTop: 1 },
});
