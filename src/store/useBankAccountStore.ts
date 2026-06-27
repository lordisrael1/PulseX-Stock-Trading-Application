import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SavedBankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  bankColor: string;
  bankShort: string;
  accountNumber: string;
  accountName: string;
}

const SEED_ACCOUNTS: SavedBankAccount[] = [
  {
    id: 'seed-gtb-0123456789',
    bankName: 'Guaranty Trust Bank',
    bankCode: '058',
    bankColor: '#E86000',
    bankShort: 'GTB',
    accountNumber: '0123456789',
    accountName: 'JOSEPH ISRAEL MOJOLAOLUWA',
  },
  {
    id: 'seed-zen-1029067800',
    bankName: 'Zenith Bank',
    bankCode: '057',
    bankColor: '#C1121F',
    bankShort: 'ZEN',
    accountNumber: '1029067800',
    accountName: 'JOSEPH ISRAEL MOJOLAOLUWA',
  },
];

const STORAGE_KEY = 'pulsex-bank-accounts';

interface BankAccountStore {
  accounts: SavedBankAccount[];
  addAccount: (account: SavedBankAccount) => void;
  removeAccount: (id: string) => void;
  reset: () => void;
}

export const useBankAccountStore = create<BankAccountStore>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      addAccount: (account) =>
        set((state) => {
          const exists = state.accounts.some(
            (a) => a.accountNumber === account.accountNumber && a.bankCode === account.bankCode,
          );
          if (exists) return state;
          return { accounts: [...state.accounts, account] };
        }),
      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
      reset: () => set({ accounts: SEED_ACCOUNTS }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export async function clearBankAccountStorage() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  useBankAccountStore.setState({ accounts: SEED_ACCOUNTS });
}
