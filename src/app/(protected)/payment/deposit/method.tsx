import { router, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    ArrowUpRight,
    Building2,
    CreditCard,
    Plus,
    Smartphone,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useBankAccountStore } from '../../../../store/useBankAccountStore';
import { useCardStore } from '../../../../store/useCardStore';
import { CardNetworkLogo } from './addCard';
import {
    Clipboard,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type MethodId = 'bank' | 'card' | 'ussd' | 'transfer';
type SubView = 'grid' | MethodId;

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_AMOUNT = 50_000;

function fmtAmount(n: number) {
    return `₦${n.toLocaleString('en-NG')}`;
}



function buildUssdCodes(amount: number) {
    return [
        { bank: 'GTBank', code: `*737*${amount}*6789#` },
        { bank: 'Zenith', code: `*966*${amount}*6789#` },
        { bank: 'Access', code: `*901*${amount}*6789#` },
        { bank: 'UBA', code: `*919*${amount}*6789#` },
        { bank: 'First Bank', code: `*894*${amount}*6789#` },
    ];
}

function buildVirtualAcct(amountFmt: string) {
    return {
        bank: 'Providus Bank',
        number: '2847163920',
        name: 'PULSEX / JOSEPH ISRAEL',
        amount: amountFmt,
        expires: 30 * 60, // seconds
    };
}


// ─── Step Bar ─────────────────────────────────────────────────────────────────

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
                <View style={[styles.stepDot, styles.stepActive]}>
                    <Text style={styles.stepDotTxtDone}>2</Text>
                </View>
                <Text style={[styles.stepLbl, styles.stepLblDone]}>Method</Text>
            </View>

            {/* Line */}
            <View style={styles.stepLine} />

            {/* Step 3 — idle */}
            <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                    <Text style={styles.stepDotTxt}>3</Text>
                </View>
                <Text style={styles.stepLbl}>Confirm</Text>
            </View>
        </View>
    );
}

// ─── Header ───────────────────────────────────────────────────────────────────

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

// ─── Method Grid (111.png) ────────────────────────────────────────────────────

function MethodGrid({ onPick }: { onPick: (m: MethodId) => void }) {
    const methods: {
        id: MethodId;
        icon: React.ReactNode;
        title: string;
        sub: string;
        badge: string;
        badgeColor: string;
        badgeBg: string;
    }[] = [
            {
                id: 'bank',
                icon: <Building2 size={22} color="#555" />,
                title: 'Bank account',
                sub: 'Debit from saved account',
                badge: 'Instant',
                badgeColor: '#0C447C',
                badgeBg: '#E8F0FB',
            },
            {
                id: 'card',
                icon: <CreditCard size={22} color="#555" />,
                title: 'Debit card',
                sub: 'Visa, Mastercard, Verve',
                badge: 'Free',
                badgeColor: '#0A5E30',
                badgeBg: '#E4F2EC',
            },
            {
                id: 'ussd',
                icon: <Smartphone size={22} color="#555" />,
                title: 'USSD',
                sub: 'Dial *737# or *966#',
                badge: 'No data',
                badgeColor: '#854F0B',
                badgeBg: '#FDF6E8',
            },
            {
                id: 'transfer',
                icon: <ArrowUpRight size={22} color="#555" />,
                title: 'Bank transfer',
                sub: 'Send to virtual account',
                badge: '0–2 min',
                badgeColor: '#0C447C',
                badgeBg: '#E8F0FB',
            },
        ];

    return (
        <View style={styles.body}>
            <Text style={styles.sectionLbl}>HOW DO YOU WANT TO FUND?</Text>
            <View style={styles.grid}>
                {methods.map(m => (
                    <TouchableOpacity
                        key={m.id}
                        style={styles.mCard}
                        onPress={() => onPick(m.id)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.mCardIcon}>{m.icon}</View>
                        <Text style={styles.mCardTitle}>{m.title}</Text>
                        <Text style={styles.mCardSub}>{m.sub}</Text>
                        <View style={[styles.badge, { backgroundColor: m.badgeBg }]}>
                            <Text style={[styles.badgeTxt, { color: m.badgeColor }]}>{m.badge}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.secFooter}>
                <Text style={styles.secTxt}>🔒  256-bit SSL · PCI DSS Level 1 · CBN licensed</Text>
            </View>
        </View>
    );
}

// ─── Bank Account Sub-screen (112.png) ────────────────────────────────────────

function BankSubScreen({ onContinue }: { onContinue: (bankId: string) => void }) {
    const accounts = useBankAccountStore((s) => s.accounts);
    const [sel, setSel] = useState(accounts[0]?.id ?? '');
    const selBank = accounts.find(b => b.id === sel);

    return (
        <View style={styles.body}>
            <Text style={styles.sectionLbl}>SAVED ACCOUNTS</Text>
            <View style={styles.listCard}>
                {accounts.map(b => (
                    <TouchableOpacity
                        key={b.id}
                        style={styles.bankRow}
                        onPress={() => setSel(b.id)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.bankLogo, { backgroundColor: b.bankColor }]}>
                            <Text style={styles.bankLogoTxt}>{b.bankShort}</Text>
                        </View>
                        <View style={styles.bankInfo}>
                            <Text style={styles.bankName}>{b.bankName}</Text>
                            <Text style={styles.bankAcct}>•••• {b.accountNumber.slice(-4)}</Text>
                        </View>
                        <View style={[styles.radioOuter, sel === b.id && styles.radioOuterSel]}>
                            {sel === b.id && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Add new */}
                <TouchableOpacity style={styles.addNewRow} onPress={() => router.push('/payment/deposit/addBank')} activeOpacity={0.7}>
                    <View style={styles.addNewIcon}>
                        <Plus size={16} color="#BBBBBB" />
                    </View>
                    <Text style={styles.addNewTxt}>Add new bank account</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.cta, !selBank && styles.ctaDisabled]}
                onPress={() => selBank && onContinue(selBank.id)}
                activeOpacity={0.85}
                disabled={!selBank}
            >
                <Text style={[styles.ctaTxt, !selBank && styles.ctaDisabledTxt]}>
                    {selBank ? `Use ${selBank.bankName}` : 'Select an account'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Card Sub-screen (113.png) ────────────────────────────────────────────────

function CardSubScreen({ onContinue }: { onContinue: (cardId: string) => void }) {
    const router = useRouter();
    const cards = useCardStore((s) => s.cards);
    const [sel, setSel] = useState(cards[0]?.id ?? '');
    const selCard = cards.find(c => c.id === sel);

    return (
        <View style={styles.body}>
            <Text style={styles.sectionLbl}>SAVED CARDS</Text>
            <View style={styles.listCard}>
                {cards.map(c => (
                    <TouchableOpacity
                        key={c.id}
                        style={styles.bankRow}
                        onPress={() => setSel(c.id)}
                        activeOpacity={0.7}
                    >
                        <CardNetworkLogo network={c.network} width={50} height={32} />
                        <View style={styles.bankInfo}>
                            <Text style={styles.bankName}>•••• •••• •••• {c.last4}</Text>
                            <Text style={styles.bankAcct}>{c.holderName}</Text>
                            <Text style={styles.bankAcct}>Exp {c.expiry}</Text>
                        </View>
                        <View style={[styles.radioOuter, sel === c.id && styles.radioOuterSel]}>
                            {sel === c.id && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Add new */}
                <TouchableOpacity style={styles.addNewRow} onPress={() => router.push('/payment/deposit/addCard')} activeOpacity={0.7}>
                    <View style={styles.addNewIcon}>
                        <Plus size={16} color="#BBBBBB" />
                    </View>
                    <Text style={styles.addNewTxt}>Add new card</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.secFooter}>
                <Text style={styles.secTxt}>🔒  Card data encrypted · Never stored on our servers</Text>
            </View>

            <TouchableOpacity
                style={[styles.cta, !selCard && styles.ctaDisabled]}
                onPress={() => selCard && onContinue(selCard.id)}
                activeOpacity={0.85}
                disabled={!selCard}
            >
                <Text style={[styles.ctaTxt, !selCard && styles.ctaDisabledTxt]}>Pay with card</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── USSD Sub-screen (114.png) ────────────────────────────────────────────────

function USSDSubScreen({ onContinue, amount }: { onContinue: () => void; amount: number }) {
    const mainCode = `*966*${amount}#`;
    const ussdCodes = buildUssdCodes(amount);

    return (
        <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.sectionLbl}>DIAL FROM YOUR REGISTERED NUMBER</Text>

            <View style={styles.ussdBox}>
                <Text style={styles.ussdCode}>{mainCode}</Text>
                {[
                    'Dial the code above on the number linked to your bank',
                    'Select your bank from the USSD menu',
                    'Enter your 4-digit USSD PIN to authorise',
                    'Your wallet credits automatically once confirmed',
                ].map((step, i) => (
                    <View key={i} style={styles.ussdStep}>
                        <View style={styles.ussdStepNum}>
                            <Text style={styles.ussdStepNumTxt}>{i + 1}</Text>
                        </View>
                        <Text style={styles.ussdStepTxt}>{step}</Text>
                    </View>
                ))}
            </View>

            <Text style={[styles.sectionLbl, { marginTop: 20 }]}>OTHER USSD CODES</Text>
            <View style={styles.listCard}>
                {ussdCodes.map(u => (
                    <View key={u.bank} style={styles.ussdCodeRow}>
                        <Text style={styles.ussdCodeBank}>{u.bank}</Text>
                        <Text style={styles.ussdCodeVal}>{u.code}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.cta} onPress={onContinue} activeOpacity={0.85}>
                <Text style={styles.ctaTxt}>I've completed the USSD payment</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ─── Bank Transfer Sub-screen (115.png) ──────────────────────────────────────

function TransferSubScreen({ onContinue, amountFmt }: { onContinue: () => void; amountFmt: string }) {
    const virtualAcct = buildVirtualAcct(amountFmt);
    const [copied, setCopied] = useState(false);
    const [secs, setSecs] = useState(virtualAcct.expires);

    // Countdown timer
    useEffect(() => {
        if (secs <= 0) return;
        const t = setTimeout(() => setSecs(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [secs]);

    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');

    const copyAcct = useCallback(() => {
        Clipboard.setString(virtualAcct.number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const rows = [
        { label: 'Bank', value: virtualAcct.bank, bold: false },
        { label: 'Account number', value: virtualAcct.number, copy: true },
        { label: 'Account name', value: virtualAcct.name, bold: true },
        { label: 'Amount', value: virtualAcct.amount, bold: false },
        { label: 'Expires in', value: `${mm}:${ss}`, bold: false },
    ];

    return (
        <View style={styles.body}>
            <Text style={styles.sectionLbl}>TRANSFER EXACTLY {amountFmt} TO</Text>

            <View style={styles.transferBox}>
                {rows.map(r => (
                    <View key={r.label} style={styles.transferRow}>
                        <Text style={styles.transferKey}>{r.label}</Text>
                        <View style={styles.transferValRow}>
                            <Text
                                style={[
                                    styles.transferVal,
                                    r.bold && styles.transferValBold,
                                ]}
                            >
                                {r.value}
                            </Text>
                            {'copy' in r && r.copy && (
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={copyAcct}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.copyBtnTxt}>{copied ? 'COPIED' : 'COPY'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.warnBox}>
                <Text style={styles.warnTxt}>
                    Transfer the exact amount. A different amount will cause a delayed or
                    failed credit. Virtual account expires in 30 minutes.
                </Text>
            </View>

            <TouchableOpacity style={styles.cta} onPress={onContinue} activeOpacity={0.85}>
                <Text style={styles.ctaTxt}>I've made the transfer</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DepositMethodScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ amount?: string }>();
    const [view, setView] = useState<SubView>('grid');

    const amount = Number.isFinite(Number(params.amount))
        ? Math.max(0, parseInt(params.amount ?? '', 10))
        : DEFAULT_AMOUNT;
    const amountFmt = fmtAmount(amount);

    const headerMap: Record<SubView, { title: string; sub: string }> = {
        grid: { title: 'Choose payment method', sub: 'Step 2 of 3' },
        bank: { title: 'Select bank account', sub: 'Step 2 of 3' },
        card: { title: 'Select debit card', sub: 'Step 2 of 3' },
        ussd: { title: 'Pay via USSD', sub: 'Step 2 of 3' },
        transfer: { title: 'Bank transfer', sub: 'Step 2 of 3' },
    };

    const handleBack = () => {
        if (view === 'grid') {
            router.push('/payment/deposit');
        } else {
            setView('grid');
        }
    };

    const goConfirmCard = (cardId: string) => {
        router.push({ pathname: '/payment/deposit/confirmCard', params: { amount: String(amount), cardId } });
    };
    const goConfirmBank = (bankId: string) => {
        router.push({ pathname: '/payment/deposit/confirm', params: { amount: String(amount), bankId } });
    };
    const goConfirmNibss = () => router.push('/payment/deposit/confirmNibss')

    const { title, sub } = headerMap[view];

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <Header title={title} sub={sub} onBack={handleBack} amountFmt={amountFmt} />

            {view === 'grid' && <MethodGrid onPick={setView} />}
            {view === 'bank' && <BankSubScreen onContinue={goConfirmBank} />}
            {view === 'card' && <CardSubScreen onContinue={goConfirmCard} />}
            {view === 'ussd' && <USSDSubScreen onContinue={goConfirmNibss} amount={amount} />}
            {view === 'transfer' && <TransferSubScreen onContinue={goConfirmNibss} amountFmt={amountFmt} />}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },

    // ── Header
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

    // ── Body
    body: {
        flex: 1,
        padding: 18,
    },
    sectionLbl: {
        fontSize: 10,
        fontWeight: '700',
        color: '#BBBBBB',
        letterSpacing: 1.4,
        marginBottom: 12,
    },

    // ── Method Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    mCard: {
        width: '47.5%',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: '#EBEBEB',
        padding: 14,
    },
    mCardIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    mCardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0A0A0A',
        marginBottom: 3,
    },
    mCardSub: {
        fontSize: 11,
        color: '#AAAAAA',
        marginBottom: 8,
        lineHeight: 16,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeTxt: {
        fontSize: 11,
        fontWeight: '700',
    },

    // ── Security footer
    secFooter: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    secTxt: {
        fontSize: 11,
        color: '#CCCCCC',
    },

    // ── List card (shared by bank + card)
    listCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: '#EBEBEB',
        overflow: 'hidden',
        marginBottom: 14,
    },
    bankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F5F5F5',
        gap: 12,
    },
    bankLogo: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bankLogoTxt: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.3,
    },
    bankInfo: {
        flex: 1,
        gap: 2,
    },
    bankName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0A0A0A',
    },
    bankAcct: {
        fontSize: 11,
        color: '#BBBBBB',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSel: {
        borderColor: '#113322',
        backgroundColor: '#113322',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    addNewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
    },
    addNewIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addNewTxt: {
        fontSize: 13,
        fontWeight: '600',
        color: '#AAAAAA',
    },

    // ── Debit card chip
    cardChip: {
        width: 50,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBrand: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },

    // ── USSD
    ussdBox: {
        backgroundColor: '#FFFBF0',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 14,
        padding: 16,
        marginBottom: 6,
    },
    ussdCode: {
        fontSize: 24,
        fontWeight: '900',
        color: '#92400E',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
        marginBottom: 14,
    },
    ussdStep: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    ussdStepNum: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    ussdStepNumTxt: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
    },
    ussdStepTxt: {
        flex: 1,
        fontSize: 12,
        color: '#78350F',
        lineHeight: 18,
    },
    ussdCodeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F5F5F5',
    },
    ussdCodeBank: {
        fontSize: 12,
        color: '#777',
    },
    ussdCodeVal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0A0A0A',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    // ── Bank transfer
    transferBox: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        gap: 10,
    },
    transferRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transferValRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    transferKey: {
        fontSize: 12,
        color: '#1E40AF',
    },
    transferVal: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E3A8A',
    },
    transferValBold: {
        fontWeight: '900',
    },
    copyBtn: {
        backgroundColor: '#DBEAFE',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    copyBtnTxt: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1E40AF',
    },
    warnBox: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    warnTxt: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },

    // ── CTA
    cta: {
        backgroundColor: '#0A0A0A',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    ctaDisabled: {
        backgroundColor: '#E8E8E8',
    },
    ctaDisabledTxt: {
        color: '#BBBBBB',
    },
    ctaTxt: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.2,
    },
});