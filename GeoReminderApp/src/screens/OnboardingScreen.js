import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Modal, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { saveLocationPrefs } from '../services/settingsStorage';
import { COUNTRIES } from '../utils/countries';

export default function OnboardingScreen({ onDone }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [city, setCity] = useState('');
  const [countryModal, setCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleContinue = async () => {
    if (!selectedCountry) return;
    setSaving(true);
    await saveLocationPrefs({
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      city: city.trim() || null,
    });
    onDone();
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top illustration */}
        <View style={styles.top}>
          <View style={styles.globeWrap}>
            <Text style={styles.globeEmoji}>🌍</Text>
          </View>
          <Text style={styles.title}>Where are you?</Text>
          <Text style={styles.sub}>
            Set your location so AI finds the right places near you — not on the other side of the world.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Country */}
          <Text style={styles.label}>Your Country <Text style={styles.req}>*</Text></Text>
          <TouchableOpacity
            style={[styles.picker, selectedCountry && styles.pickerSelected]}
            onPress={() => { setCountrySearch(''); setCountryModal(true); }}
            activeOpacity={0.8}
          >
            {selectedCountry ? (
              <Text style={styles.pickerValueText}>
                {selectedCountry.emoji}  {selectedCountry.name}
              </Text>
            ) : (
              <Text style={styles.pickerPlaceholder}>Select your country...</Text>
            )}
            <Text style={styles.pickerArrow}>▾</Text>
          </TouchableOpacity>

          {/* City */}
          <Text style={[styles.label, { marginTop: 20 }]}>
            Your City <Text style={styles.opt}>(optional but recommended)</Text>
          </Text>
          <TextInput
            style={styles.cityInput}
            placeholder="e.g. Islamabad, Karachi, Lahore..."
            placeholderTextColor="#6b7280"
            value={city}
            onChangeText={setCity}
            returnKeyType="done"
          />

          {/* Preview */}
          {selectedCountry && (
            <View style={styles.preview}>
              <Text style={styles.previewIcon}>✨</Text>
              <View style={styles.previewText}>
                <Text style={styles.previewTitle}>AI will search in</Text>
                <Text style={styles.previewVal}>
                  {[city.trim(), selectedCountry.name].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.continueBtn, !selectedCountry && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!selectedCountry || saving}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {saving ? 'Saving...' : 'Continue →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal visible={countryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🌍 Select Country</Text>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search..."
              placeholderTextColor="#6b7280"
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(c) => c.code}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.code === item.code && styles.countryItemActive,
                  ]}
                  onPress={() => { setSelectedCountry(item); setCountryModal(false); }}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  {selectedCountry?.code === item.code && (
                    <Text style={styles.countryCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.modalClose} onPress={() => setCountryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  top: { alignItems: 'center', paddingTop: 80 },
  globeWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(76,110,245,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(76,110,245,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  globeEmoji: { fontSize: 48 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#a0aec0', fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 10 },

  form: { flex: 1, justifyContent: 'center', paddingVertical: 30 },
  label: { color: '#a0aec0', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  req: { color: '#e53e3e' },
  opt: { color: '#4a5568', fontWeight: '400', fontSize: 12 },

  picker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2d2d4e',
    padding: 16,
  },
  pickerSelected: { borderColor: '#4c6ef5' },
  pickerPlaceholder: { color: '#4a5568', fontSize: 15, flex: 1 },
  pickerValueText: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  pickerArrow: { color: '#718096', fontSize: 18 },

  cityInput: {
    backgroundColor: '#1a1a2e', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#2d2d4e',
    padding: 16, fontSize: 15, color: '#fff',
  },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(76,110,245,0.12)',
    borderWidth: 1, borderColor: 'rgba(76,110,245,0.3)',
    borderRadius: 12, padding: 14, marginTop: 20,
  },
  previewIcon: { fontSize: 22 },
  previewText: { flex: 1 },
  previewTitle: { color: '#7f9cf5', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  previewVal: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },

  actions: { gap: 12 },
  continueBtn: {
    backgroundColor: '#4c6ef5', borderRadius: 14,
    padding: 18, alignItems: 'center',
    elevation: 6, shadowColor: '#4c6ef5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  continueBtnDisabled: { backgroundColor: '#2d2d4e' },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipBtnText: { color: '#4a5568', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 34,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 14 },
  modalSearch: {
    backgroundColor: '#0d0d1a', borderRadius: 12,
    borderWidth: 1, borderColor: '#2d2d4e',
    padding: 12, fontSize: 15, color: '#fff', marginBottom: 10,
  },
  countryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#2d2d4e',
  },
  countryItemActive: { backgroundColor: 'rgba(76,110,245,0.1)' },
  countryEmoji: { fontSize: 22 },
  countryName: { flex: 1, color: '#fff', fontSize: 15 },
  countryCheck: { color: '#4c6ef5', fontSize: 18, fontWeight: '800' },
  modalClose: {
    backgroundColor: '#2d2d4e', borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 12,
  },
  modalCloseText: { color: '#a0aec0', fontWeight: '700', fontSize: 15 },
});
