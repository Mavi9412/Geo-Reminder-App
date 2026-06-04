import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { getReminders, saveReminder } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

const buildMapHTML = (reminders, darkMode) => {
  const pins = reminders.map((r) => ({
    lat: r.latitude,
    lng: r.longitude,
    title: r.title,
    radius: r.radius,
    trigger: r.trigger,
    enabled: r.enabled,
    triggered: r.triggered,
  }));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; }
    ${darkMode ? `
    .leaflet-layer, .leaflet-control-zoom, .leaflet-control-attribution { filter: invert(100%) hue-rotate(180deg); }
    ` : ''}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);

  var pins = ${JSON.stringify(pins)};
  var bounds = [];

  pins.forEach(function(p) {
    var color = p.triggered ? '#48bb78' : (p.enabled ? '#4c6ef5' : '#a0aec0');
    var icon = L.divIcon({
      html: '<div style="background:' + color + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
      iconSize:[14,14], className:''
    });
    var marker = L.marker([p.lat, p.lng], {icon:icon}).addTo(map);
    marker.bindPopup('<b>' + p.title + '</b><br>' +
      (p.trigger==='arrival'?'🟢 Arrival':'🔴 Exit') + ' · ' + p.radius + 'm' +
      (p.triggered ? '<br><span style="color:#48bb78">✓ Triggered</span>' : '') +
      (!p.enabled ? '<br><span style="color:#a0aec0">Disabled</span>' : ''));

    L.circle([p.lat, p.lng], {
      radius: p.radius,
      color: color, fillColor: color, fillOpacity: 0.12, weight: 2
    }).addTo(map);

    bounds.push([p.lat, p.lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40,40] });
  } else {
    map.setView([33.6844, 73.0479], 12);
  }

  // Double-tap to create
  var lastTap = 0;
  map.on('click', function(e) {
    var now = Date.now();
    if (now - lastTap < 350) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'newPin', lat: e.latlng.lat, lng: e.latlng.lng
      }));
    }
    lastTap = now;
  });
</script>
</body>
</html>`;
};

export default function MapViewScreen({ navigation }) {
  const { theme } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPin, setNewPin] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  useFocusEffect(useCallback(() => {
    getReminders().then((r) => { setReminders(r); setLoading(false); });
  }, []));

  const handleMessage = (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'newPin') {
        setNewPin({ latitude: data.lat, longitude: data.lng });
        setNewTitle('');
        setModalVisible(true);
      }
    } catch {}
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return Alert.alert('Enter a title');
    await saveReminder({
      title: newTitle.trim(),
      latitude: newPin.latitude,
      longitude: newPin.longitude,
      radius: 200,
      trigger: 'arrival',
      triggered: false,
      wasInside: false,
      category: 'Personal',
    });
    setModalVisible(false);
    const updated = await getReminders();
    setReminders(updated);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>🗺️ All Geofences</Text>
        <Text style={[styles.headerSub, { color: theme.textSub }]}>
          {reminders.length} total · Double-tap map to add
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <WebView
          style={styles.map}
          originWhitelist={['*']}
          source={{ html: buildMapHTML(reminders, theme.mode === 'dark') }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />
      )}

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {[
          { color: '#4c6ef5', label: 'Active' },
          { color: '#48bb78', label: 'Triggered' },
          { color: '#a0aec0', label: 'Disabled' },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={[styles.legendText, { color: theme.textSub }]}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick create modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>📍 New Reminder Here</Text>
            {newPin && (
              <Text style={[styles.modalCoords, { color: theme.textSub }]}>
                {newPin.latitude.toFixed(5)}, {newPin.longitude.toFixed(5)}
              </Text>
            )}
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Reminder title..."
              placeholderTextColor={theme.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleCreate}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 48, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 4 },
  map: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  legend: {
    position: 'absolute', bottom: 20, left: 16,
    flexDirection: 'row', gap: 14, padding: 10,
    borderRadius: 12, borderWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalCoords: { fontSize: 12, marginBottom: 16, fontFamily: 'monospace' },
  modalInput: {
    borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 16, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontWeight: '700', fontSize: 15 },
});
