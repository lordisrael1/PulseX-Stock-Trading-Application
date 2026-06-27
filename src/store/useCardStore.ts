import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CardNetwork = 'visa' | 'mastercard' | 'verve' | 'amex' | 'unknown';

export interface SavedCard {
  id: string;
  network: CardNetwork;
  last4: string;
  holderName: string;
  expiry: string;
}

const SEED_CARDS: SavedCard[] = [
  {
    id: 'seed-visa-4521',
    network: 'visa',
    last4: '4521',
    holderName: 'JOSEPH ISRAEL',
    expiry: '09/27',
  },
];

const STORAGE_KEY = 'pulsex-cards';

interface CardStore {
  cards: SavedCard[];
  addCard: (card: SavedCard) => void;
  removeCard: (id: string) => void;
  reset: () => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      cards: SEED_CARDS,
      addCard: (card) =>
        set((state) => {
          const exists = state.cards.some((c) => c.last4 === card.last4 && c.network === card.network);
          if (exists) return state;
          return { cards: [...state.cards, card] };
        }),
      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),
      reset: () => set({ cards: SEED_CARDS }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export async function clearCardStorage() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  useCardStore.setState({ cards: SEED_CARDS });
}
