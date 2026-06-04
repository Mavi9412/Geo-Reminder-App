import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { parseReminderWithAI, transcribeAudio, GROQ_API_KEY } from '../services/groq';
import { searchLocation } from '../services/geocoding';
import { saveReminder } from '../services/storage';

const EXAMPLES = [
  'Remind me to buy milk when I reach Metro Store',
  'Call mom when I leave the office',
  'Pick up medicine when I arrive at pharmacy',
  'Buy petrol when I pass the Shell station',
];

export default function AIReminderScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [step, setStep] = useState('input');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [parsed, setParsed] = useState(null);
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Voice recording state
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return Alert.alert('Permission Denied', 'Microphone access is required for voice input.');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      startPulse();
    } catch (e) {
      Alert.alert('Error', 'Could not start recording: ' + e.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    stopPulse();

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      setLoading(true);
      setLoadingMsg('🎤 Transcribing your voice...');
      const transcribed = await transcribeAudio(uri);

      if (!transcribed) return Alert.alert('Could not hear', 'Please try speaking again.');

      setInput(transcribed);
      setLoading(false);

      // Auto-analyze after transcription
      await analyzeText(transcribed);
    } catch (e) {
      setLoading(false);
      Alert.alert('Transcription Error', e.message);
    }
  };

  const analyzeText = async (text) => {
    const textToUse = text || input;
    if (!textToUse.trim()) return;

    if (GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      return Alert.alert('API Key Missing', 'Please add your Groq API key in src/services/groq.js');
    }

    setLoading(true);
    setLoadingMsg('🤖 AI is reading your reminder...');

    try {
      const result = await parseReminderWithAI(textToUse);
      setParsed(result);

      if (result.location) {
        setLoadingMsg('🗺️ Searching location on map...');
        const locations = await searchLocation(result.location);
        if (locations.length === 0) {
          Alert.alert('Location Not Found', `Could not find "${result.location}" on the map. Try being more specific.`);
          setLoading(false);
          return;
        }
        setLocationResults(locations);
        setStep('results');
      } else {
        setStep('confirm');
        setSelectedLocation(null);
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setStep('confirm');
  };

  const handleSave = async () => {
    if (!selectedLocation) return Alert.alert('No Location', 'Please select a location first.');
    try {
      await saveReminder({
        title: parsed.task,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radius: parsed.radius || 200,
        trigger: parsed.trigger || 'arrival',
        triggered: false,
        wasInside: false,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('✅ Saved!', `"${parsed.task}" reminder created.`, [
        { text: 'Go Home', onPress: () => navigation.navigate('Home') },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save reminder.');
    }
  };

  const reset = () => {
    setStep('input');
    setParsed(null);
    setLocationResults([]);
    setSelectedLocation(null);
    setInput('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.aiHeader}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.aiTitle}>AI Reminder</Text>
          <Text style={styles.aiSub}>Type or speak — AI will understand</Text>
        </View>

        {/* Input Step */}
        {step === 'input' && (
          <>
            {/* Voice Button */}
            <View style={styles.voiceSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.micBtn, isRecording && styles.micBtnActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                  activeOpacity={0.8}
                >
                  <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.micLabel}>
                {isRecording ? 'Tap to stop recording...' : 'Tap to speak your reminder'}
              </Text>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR TYPE</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.bigInput}
              placeholder="e.g. Remind me to buy milk when I reach Metro Store..."
              placeholderTextColor="#a0aec0"
              value={input}
              onChangeText={setInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.examplesLabel}>EXAMPLES</Text>
            {EXAMPLES.map((ex, i) => (
              <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => setInput(ex)}>
                <Text style={styles.exampleText}>"{ex}"</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.btn, (!input.trim() || loading) && styles.btnDisabled]}
              onPress={() => analyzeText()}
              disabled={!input.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.btnText}>{loadingMsg}</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>✨  Analyze with AI</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Location Results Step */}
        {step === 'results' && parsed && (
          <>
            <View style={styles.parsedBox}>
              <Text style={styles.parsedLabel}>AI UNDERSTOOD</Text>
              <Text style={styles.parsedTask}>📌 {parsed.task}</Text>
              <Text style={styles.parsedDetail}>
                {parsed.trigger === 'arrival' ? '🟢 On Arrival' : '🔴 On Exit'} · {parsed.radius || 200}m radius
              </Text>
            </View>

            <Text style={styles.sectionLabel}>SELECT LOCATION</Text>
            <Text style={styles.sectionSub}>Found these matches for "{parsed.location}"</Text>

            {locationResults.map((loc, i) => (
              <TouchableOpacity key={i} style={styles.locationResult} onPress={() => handleSelectLocation(loc)} activeOpacity={0.8}>
                <Text style={styles.locationResultIcon}>📍</Text>
                <View style={styles.locationResultInfo}>
                  <Text style={styles.locationResultName} numberOfLines={1}>{loc.shortName}</Text>
                  <Text style={styles.locationResultAddr} numberOfLines={2}>{loc.name}</Text>
                </View>
                <Text style={styles.locationResultArrow}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.backBtn} onPress={reset}>
              <Text style={styles.backBtnText}>← Try Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && parsed && (
          <>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmLabel}>REMINDER PREVIEW</Text>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>Task</Text>
                <Text style={styles.confirmVal}>{parsed.task}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>Location</Text>
                <Text style={styles.confirmVal}>{selectedLocation?.shortName || 'Not selected'}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>Trigger</Text>
                <Text style={styles.confirmVal}>{parsed.trigger === 'arrival' ? '🟢 On Arrival' : '🔴 On Exit'}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>Radius</Text>
                <Text style={styles.confirmVal}>{parsed.radius || 200}m</Text>
              </View>
            </View>

            <View style={styles.notifPreview}>
              <Text style={styles.notifPreviewLabel}>NOTIFICATION PREVIEW</Text>
              <Text style={styles.notifPreviewText}>
                📍 Geo Reminder{'\n'}
                {parsed.trigger === 'arrival'
                  ? `You have arrived near "${parsed.task}" location!`
                  : `You have left "${parsed.task}" location!`}
              </Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.btnText}>✅  Save Reminder</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('results')}>
              <Text style={styles.backBtnText}>← Change Location</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Full screen loading overlay */}
        {loading && step === 'input' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4c6ef5" />
            <Text style={styles.loadingOverlayText}>{loadingMsg}</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 20, paddingBottom: 50 },
  aiHeader: { alignItems: 'center', paddingVertical: 20 },
  aiIcon: { fontSize: 52 },
  aiTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginTop: 8 },
  aiSub: { fontSize: 14, color: '#718096', marginTop: 4 },

  // Voice
  voiceSection: { alignItems: 'center', paddingVertical: 24 },
  micBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4c6ef5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4c6ef5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  micBtnActive: {
    backgroundColor: '#e53e3e',
    shadowColor: '#e53e3e',
  },
  micIcon: { fontSize: 38 },
  micLabel: { marginTop: 14, color: '#718096', fontSize: 14, fontWeight: '500' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e53e3e',
  },
  recordingText: { color: '#e53e3e', fontWeight: '700', fontSize: 14 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#a0aec0', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  bigInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2d3748',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minHeight: 90,
  },
  examplesLabel: {
    fontSize: 11, fontWeight: '700', color: '#718096',
    letterSpacing: 1, marginTop: 20, marginBottom: 10,
  },
  exampleChip: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0',
  },
  exampleText: { color: '#4a5568', fontSize: 13, fontStyle: 'italic' },
  btn: {
    marginTop: 20, backgroundColor: '#4c6ef5', borderRadius: 14,
    padding: 18, alignItems: 'center', elevation: 4,
    shadowColor: '#4c6ef5', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6,
  },
  btnDisabled: { backgroundColor: '#a0aec0' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  parsedBox: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 20 },
  parsedLabel: { color: '#a0aec0', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  parsedTask: { color: '#fff', fontSize: 18, fontWeight: '700' },
  parsedDetail: { color: '#90cdf4', fontSize: 13, marginTop: 6 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#718096', letterSpacing: 1, marginBottom: 4 },
  sectionSub: { color: '#a0aec0', fontSize: 13, marginBottom: 12 },
  locationResult: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 10,
  },
  locationResultIcon: { fontSize: 22 },
  locationResultInfo: { flex: 1 },
  locationResultName: { fontWeight: '700', color: '#2d3748', fontSize: 15 },
  locationResultAddr: { color: '#718096', fontSize: 12, marginTop: 2 },
  locationResultArrow: { color: '#4c6ef5', fontSize: 22, fontWeight: '700' },

  confirmCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16,
  },
  confirmLabel: { fontSize: 11, fontWeight: '700', color: '#718096', letterSpacing: 1, marginBottom: 14 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f7fafc',
  },
  confirmKey: { color: '#718096', fontSize: 14, fontWeight: '600' },
  confirmVal: { color: '#2d3748', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },

  notifPreview: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 4 },
  notifPreviewLabel: { color: '#a0aec0', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  notifPreviewText: { color: '#fff', fontSize: 14, lineHeight: 22 },

  backBtn: { alignItems: 'center', marginTop: 16, padding: 10 },
  backBtnText: { color: '#4c6ef5', fontWeight: '600', fontSize: 15 },

  loadingOverlay: { alignItems: 'center', paddingVertical: 30, gap: 14 },
  loadingOverlayText: { color: '#4a5568', fontSize: 15, fontWeight: '600' },
});
