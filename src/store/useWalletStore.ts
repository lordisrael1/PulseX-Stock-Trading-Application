import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const INITIAL_NGN_BALANCE = 44_678.32;
const INITIAL_USD_BALANCE = 29.14;

const STORAGE_KEY = 'pulsex-wallet';

interface WalletStore {
  ngnBalance: number;
  usdBalance: number;
  depositNGN: (amount: number) => void;
  withdrawNGN: (amount: number) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ngnBalance: INITIAL_NGN_BALANCE,
      usdBalance: INITIAL_USD_BALANCE,
      depositNGN: (amount) =>
        set((state) => ({ ngnBalance: state.ngnBalance + amount })),
      withdrawNGN: (amount) =>
        set((state) => ({ ngnBalance: Math.max(0, state.ngnBalance - amount) })),
      reset: () =>
        set({ ngnBalance: INITIAL_NGN_BALANCE, usdBalance: INITIAL_USD_BALANCE }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export async function clearWalletStorage() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  useWalletStore.setState({
    ngnBalance: INITIAL_NGN_BALANCE,
    usdBalance: INITIAL_USD_BALANCE,
  });
}
