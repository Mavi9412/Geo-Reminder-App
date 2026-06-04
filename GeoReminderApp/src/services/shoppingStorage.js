import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOPPING_KEY = '@geo_shopping';

export const getShoppingItems = async () => {
  const json = await AsyncStorage.getItem(SHOPPING_KEY);
  return json ? JSON.parse(json) : [];
};

export const addShoppingItem = async (item) => {
  const items = await getShoppingItems();
  const updated = [
    ...items,
    { ...item, id: Date.now().toString(), checked: false, createdAt: new Date().toISOString() },
  ];
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(updated));
  return updated;
};

export const toggleShoppingItem = async (id) => {
  const items = await getShoppingItems();
  const updated = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteShoppingItem = async (id) => {
  const items = await getShoppingItems();
  const updated = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(updated));
  return updated;
};

export const clearCheckedItems = async () => {
  const items = await getShoppingItems();
  const updated = items.filter((i) => !i.checked);
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(updated));
  return updated;
};
