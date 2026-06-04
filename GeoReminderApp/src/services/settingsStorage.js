import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_PREFS_KEY = '@geo_location_prefs';

export const getLocationPrefs = async () => {
  const json = await AsyncStorage.getItem(LOCATION_PREFS_KEY);
  return json ? JSON.parse(json) : { country: null, countryCode: null, city: null };
};

export const saveLocationPrefs = async (prefs) => {
  await AsyncStorage.setItem(LOCATION_PREFS_KEY, JSON.stringify(prefs));
};
