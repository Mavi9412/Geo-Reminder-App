import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = '@geo_reminders';

export const getReminders = async () => {
  const json = await AsyncStorage.getItem(REMINDERS_KEY);
  return json ? JSON.parse(json) : [];
};

export const saveReminder = async (reminder) => {
  const reminders = await getReminders();
  const updated = [
    ...reminders,
    {
      ...reminder,
      id: Date.now().toString(),
      enabled: true,
      category: reminder.category || 'Personal',
    },
  ];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteReminder = async (id) => {
  const reminders = await getReminders();
  const updated = reminders.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const updateReminder = async (id, changes) => {
  const reminders = await getReminders();
  const updated = reminders.map((r) => (r.id === id ? { ...r, ...changes } : r));
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const toggleReminder = async (id) => {
  const reminders = await getReminders();
  const updated = reminders.map((r) =>
    r.id === id ? { ...r, enabled: !r.enabled, triggered: false } : r
  );
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  return updated;
};
