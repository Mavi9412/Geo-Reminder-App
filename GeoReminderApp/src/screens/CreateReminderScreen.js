import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { saveReminder, updateReminder } from '../services/storage';
import { setMapCallback } from '../utils/mapCallback';

const RADIUS_OPTIONS = [
  { label: '100m', value: 100 },
  { label: '200m', value: 200 },
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
];

const TRIGGER_OPTIONS = [
  { label: '🟢 On Arrival', value: 'arrival' },
  { label: '🔴 On Exit', value: 'exit' },
];

export default function CreateReminderScreen({ route, navigation }) {
  const existing = route.params?.reminder;

  const [title, setTitle] = useState(existing?.title || '');
  const [location, setLocation] = useState(
    existing ? { latitude: existing.latitude, longitude: existing.longitude } : null
  );
  const [radius, setRadius] = useState(existing?.radius || 200);
  const [trigger, setTrigger] = useState(existing?.trigger || 'arrival');
  const [saving, setSaving] = useState(false);

  const openMap = () => {
    setMapCallback((coords) => setLocation(coords));
    navigation.navigate('MapPicker', { initialLocation: location, radius });
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Missing Title', 'Please enter a reminder title.');
    if (!location) return Alert.alert('Missing Location', 'Please select a location on the map.');

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        radius,
        trigger,
        triggered: false,
        wasInside: false,
        createdAt: new Date().toISOString(),
      };

      if (existing) {
        await updateReminder(existing.id, data);
      } else {
        await saveReminder(data);
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>REMINDER TITLE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Buy Milk at Metro Store"
          placeholderTextColor="#a0aec0"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        <Text style={styles.sectionLabel}>LOCATION</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={openMap} activeOpacity={0.8}>
          {location ? (
            <>
              <Text style={styles.locationBtnIcon}>📍</Text>
              <View>
                <Text style={styles.locationBtnTitle}>Location Selected</Text>
                <Text style={styles.locationBtnCoords}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              </View>
              <Text style={styles.locationBtnChange}>Change</Text>
            </>
          ) : (
            <>
              <Text style={styles.locationBtnIcon}>🗺️</Text>
              <Text style={styles.locationBtnPlaceholder}>Tap to select location on map</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>TRIGGER RADIUS</Text>
        <View style={styles.row}>
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, radius === opt.value && styles.chipActive]}
              onPress={() => setRadius(opt.value)}
            >
              <Text style={[styles.chipText, radius === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>TRIGGER TYPE</Text>
        <View style={styles.row}>
          {TRIGGER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.triggerChip, trigger === opt.value && styles.triggerChipActive]}
              onPress={() => setTrigger(opt.value)}
            >
              <Text style={[styles.chipText, trigger === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Text style={styles.previewText}>
            📍 Geo Reminder{'\n'}
            {trigger === 'arrival'
              ? `You have arrived near "${title || '...'}" location!`
              : `You have left "${title || '...'}" location!`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : existing ? '💾  Update Reminder' : '✅  Save Reminder'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  locationBtnIcon: { fontSize: 24 },
  locationBtnTitle: { fontWeight: '600', color: '#2d3748', fontSize: 15 },
  locationBtnCoords: { color: '#718096', fontSize: 12, marginTop: 2 },
  locationBtnPlaceholder: { color: '#a0aec0', fontSize: 15, flex: 1 },
  locationBtnChange: { marginLeft: 'auto', color: '#4c6ef5', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#4c6ef5', borderColor: '#4c6ef5' },
  triggerChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  triggerChipActive: { backgroundColor: '#4c6ef5', borderColor: '#4c6ef5' },
  chipText: { fontWeight: '600', color: '#4a5568', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  previewBox: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
  },
  previewTitle: { color: '#a0aec0', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  previewText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  saveBtn: {
    marginTop: 28,
    backgroundColor: '#4c6ef5',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4c6ef5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  saveBtnDisabled: { backgroundColor: '#a0aec0' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
