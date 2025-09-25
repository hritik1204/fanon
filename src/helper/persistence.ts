import AsyncStorage from "@react-native-async-storage/async-storage";

export const asyncPersistence = {
  type: "LOCAL" as const,
  async getItem(key: string) {
    return (await AsyncStorage.getItem(key)) ?? null;
  },
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
