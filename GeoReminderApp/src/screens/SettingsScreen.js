import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert,
  ScrollView, TextInput, Modal, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { clearHistory } from '../services/historyStorage';
import { getLocationPrefs, saveLocationPrefs } from '../services/settingsStorage';
import { COUNTRIES } from '../utils/countries';

const RADIUS_OPTIONS = [100, 200, 500, 1000];

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(theme);

  const [defaultRadius, setDefaultRadius] = useState(200);
  const [notifications, setNotifications] = useState(true);

  // Location prefs
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [city, setCity] = useState('');
  const [countryModal, setCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);

  useEffect(() => {
    getLocationPrefs().then((prefs) => {
      if (prefs.country) {
        const found = COUNTRIES.find((c) => c.name === prefs.country);
        setSelectedCountry(found || null);
      }
      if (prefs.city) setCity(prefs.city);
    });
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSaveLocation = async () => {
    if (!selectedCountry) return Alert.alert('Select Country', 'Please select your country first.');
    await saveLocationPrefs({
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      city: city.trim() || null,
    });
    setLocationSaved(true);
    setTimeout(() => setLocationSaved(false), 2000);
  };

  const handleClearAll = () => {
    Alert.alert('Reset App Data', 'This will delete all reminders, history, and shopping items. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['@geo_reminders', '@geo_history', '@geo_shopping', '@geo_location_prefs']);
          Alert.alert('Done', 'All data cleared. Restart the app.');
        },
      },
    ]);
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Delete all trigger logs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearHistory(); Alert.alert('Done', 'History cleared.'); } },
    ]);
  };

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.topPad} />
        <Text style={s.pageTitle}>⚙️ Settings</Text>

        {/* ── YOUR LOCATION ── */}
        <Text style={s.sectionLabel}>YOUR LOCATION</Text>
        <View style={s.card}>
          <Text style={s.locationDesc}>
            Set your country and city so the AI and map search find the right places near you.
          </Text>

          {/* Country picker */}
          <Text style={s.fieldLabel}>Country <Text style={s.required}>*</Text></Text>
          <TouchableOpacity
            style={[s.pickerBtn, { borderColor: selectedCountry ? theme.accent : theme.inputBorder }]}
            onPress={() => { setCountrySearch(''); setCountryModal(true); }}
          >
            {selectedCountry ? (
              <Text style={[s.pickerBtnText, { color: theme.text }]}>
                {selectedCountry.emoji}  {selectedCountry.name}
              </Text>
            ) : (
              <Text style={[s.pickerBtnText, { color: theme.textMuted }]}>Select your country...</Text>
            )}
            <Text style={[s.pickerArrow, { color: theme.textSub }]}>▾</Text>
          </TouchableOpacity>

          {/* City input */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            City <Text style={s.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[s.cityInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="e.g. Islamabad, Karachi, Lahore..."
            placeholderTextColor={theme.textMuted}
            value={city}
            onChangeText={setCity}
          />

          {selectedCountry && (
            <View style={s.previewBox}>
              <Text style={s.previewLabel}>AI WILL SEARCH IN</Text>
              <Text style={s.previewValue}>
                {[city.trim(), selectedCountry.name].filter(Boolean).join(', ')}
              </Text>
              <Text style={s.previewExample}>
                e.g. "Metro Store" → Metro Store, {city.trim() || selectedCountry.name}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, !selectedCountry && s.saveBtnDisabled]}
            onPress={handleSaveLocation}
            disabled={!selectedCountry}
          >
            <Text style={s.saveBtnText}>
              {locationSaved ? '✓  Saved!' : '💾  Save Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── APPEARANCE ── */}
        <Text style={s.sectionLabel}>APPEARANCE</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.rowIcon}>{theme.mode === 'dark' ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={s.rowTitle}>{theme.mode === 'dark' ? 'Dark Cosmic Mode' : 'Light Bento Mode'}</Text>
                <Text style={s.rowSub}>Switch interface theme</Text>
              </View>
            </View>
            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── DEFAULT RADIUS ── */}
        <Text style={s.sectionLabel}>DEFAULT ALERT RADIUS</Text>
        <View style={s.card}>
          <Text style={[s.rowSub, { padding: 16, paddingBottom: 0 }]}>Used when creating reminders via AI</Text>
          <View style={s.radiusRow}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.radiusChip, defaultRadius === r && s.radiusChipActive]}
                onPress={() => setDefaultRadius(r)}
              >
                <Text style={[s.radiusText, defaultRadius === r && s.radiusTextActive]}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Text style={s.rowIcon}>🔔</Text>
              <View>
                <Text style={s.rowTitle}>Geo Alerts</Text>
                <Text style={s.rowSub}>Trigger notifications at geofences</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── DATA ── */}
        <Text style={s.sectionLabel}>DATA & BACKUP</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.dataRow} onPress={() => Alert.alert('Cloud Backup', 'Coming soon! Your data is safely stored locally.')}>
            <Text style={s.rowIcon}>☁️</Text>
            <View style={s.rowFlex}>
              <Text style={s.rowTitle}>Cloud Backup</Text>
              <Text style={s.rowSub}>Save your geofences to cloud</Text>
            </View>
            <Text style={[s.badge, { backgroundColor: theme.accentLight, color: theme.accent }]}>Soon</Text>
          </TouchableOpacity>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={s.dataRow} onPress={handleClearHistory}>
            <Text style={s.rowIcon}>🗑️</Text>
            <View style={s.rowFlex}>
              <Text style={s.rowTitle}>Clear History Logs</Text>
              <Text style={s.rowSub}>Remove all trigger records</Text>
            </View>
          </TouchableOpacity>
          <View style={[s.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={s.dataRow} onPress={handleClearAll}>
            <Text style={s.rowIcon}>⚠️</Text>
            <View style={s.rowFlex}>
              <Text style={[s.rowTitle, { color: theme.danger }]}>Reset All App Data</Text>
              <Text style={s.rowSub}>Deletes reminders, history, shopping list</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── ABOUT ── */}
        <Text style={s.sectionLabel}>ABOUT</Text>
        <View style={s.card}>
          {[
            ['App', 'GeoReminder AI'],
            ['Version', '1.0.0'],
            ['Map', 'OpenStreetMap (Free)'],
            ['AI Model', 'Groq · Llama 3.1 + Whisper'],
            ['Storage', 'Local (AsyncStorage)'],
          ].map(([key, val]) => (
            <View key={key} style={[s.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={s.infoKey}>{key}</Text>
              <Text style={s.infoVal}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />

        <View style={s.poweredBy}>
          <Text style={s.poweredByText}>Powered by Mavi</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={countryModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>🌍 Select Country</Text>

            <TextInput
              style={[s.modalSearch, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Search country..."
              placeholderTextColor={theme.textMuted}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(c) => c.code}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    s.countryItem,
                    { borderBottomColor: theme.border },
                    selectedCountry?.code === item.code && { backgroundColor: theme.accentLight },
                  ]}
                  onPress={() => { setSelectedCountry(item); setCountryModal(false); }}
                >
                  <Text style={s.countryEmoji}>{item.emoji}</Text>
                  <Text style={[s.countryName, { color: theme.text }]}>{item.name}</Text>
                  {selectedCountry?.code === item.code && (
                    <Text style={[s.countryCheck, { color: theme.accent }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={[s.modalClose, { backgroundColor: theme.border }]} onPress={() => setCountryModal(false)}>
              <Text style={[s.modalCloseText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16 },
  topPad: { height: 40 },
  pageTitle: { color: theme.text, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  sectionLabel: {
    color: theme.textMuted, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, marginBottom: 8, marginTop: 18,
  },
  card: {
    backgroundColor: theme.card, borderRadius: 16,
    borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
  },

  // Location section
  locationDesc: { color: theme.textSub, fontSize: 13, lineHeight: 19, padding: 16, paddingBottom: 14 },
  fieldLabel: { color: theme.textSub, fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  required: { color: theme.danger },
  optional: { color: theme.textMuted, fontWeight: '400' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1.5,
    padding: 13, backgroundColor: theme.input,
  },
  pickerBtnText: { fontSize: 15, fontWeight: '600', flex: 1 },
  pickerArrow: { fontSize: 16 },
  cityInput: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1.5,
    padding: 13, fontSize: 15,
  },
  previewBox: {
    margin: 16, marginTop: 14, backgroundColor: theme.accentLight,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.accent,
  },
  previewLabel: { color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  previewValue: { color: theme.text, fontSize: 15, fontWeight: '700' },
  previewExample: { color: theme.textSub, fontSize: 12, marginTop: 4 },
  saveBtn: {
    margin: 16, marginTop: 8, backgroundColor: theme.accent,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: theme.border },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Common rows
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowFlex: { flex: 1 },
  rowIcon: { fontSize: 22 },
  rowTitle: { color: theme.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: theme.textSub, fontSize: 12, marginTop: 2 },
  radiusRow: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 10 },
  radiusChip: {
    flex: 1, padding: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: theme.card2, borderWidth: 1, borderColor: theme.border,
  },
  radiusChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  radiusText: { color: theme.textSub, fontWeight: '700', fontSize: 14 },
  radiusTextActive: { color: '#fff' },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  divider: { height: 1, marginHorizontal: 16 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoKey: { color: theme.textSub, fontSize: 13, fontWeight: '600' },
  infoVal: { color: theme.text, fontSize: 13, fontWeight: '600' },
  poweredBy: { alignItems: 'center', paddingVertical: 10 },
  poweredByText: { color: theme.textMuted, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },

  // Country Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14 },
  modalSearch: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontSize: 15, marginBottom: 10,
  },
  countryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  countryEmoji: { fontSize: 22 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '500' },
  countryCheck: { fontSize: 18, fontWeight: '800' },
  modalClose: {
    borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12,
  },
  modalCloseText: { fontWeight: '700', fontSize: 15 },
});
