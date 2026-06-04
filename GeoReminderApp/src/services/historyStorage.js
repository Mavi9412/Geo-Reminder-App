import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@geo_history';
const MAX_LOGS = 100;

export const getHistory = async () => {
  const json = await AsyncStorage.getItem(HISTORY_KEY);
  return json ? JSON.parse(json) : [];
};

export const logTrigger = async ({ reminderTitle, latitude, longitude, triggerType }) => {
  const history = await getHistory();
  const entry = {
    id: Date.now().toString(),
    reminderTitle,
    latitude,
    longitude,
    triggerType,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...history].slice(0, MAX_LOGS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const clearHistory = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};
