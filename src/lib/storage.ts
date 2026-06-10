import * as SecureStore from "expo-secure-store";

export const storage = {
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },

  async getString(key: string) {
    return await SecureStore.getItemAsync(key);
  },

  async delete(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};