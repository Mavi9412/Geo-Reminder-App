import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getCurrentLocation } from '../services/locationTracker';
import { callMapCallback } from '../utils/mapCallback';
import { searchLocation } from '../services/geocoding';

const buildLeafletHTML = (lat, lng, radius) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var marker = null;
    var circle = null;
    var radius = ${radius};

    function placeMarker(latlng) {
      if (marker) { map.removeLayer(marker); map.removeLayer(circle); }
      marker = L.marker(latlng).addTo(map);
      circle = L.circle(latlng, {
        radius: radius,
        color: '#4c6ef5',
        fillColor: '#4c6ef5',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location',
        lat: latlng.lat,
        lng: latlng.lng
      }));
    }

    // Listen for flyTo commands from React Native
    window.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'flyTo') {
          var latlng = L.latLng(msg.lat, msg.lng);
          map.flyTo(latlng, 16, { animate: true, duration: 1 });
          placeMarker(latlng);
        }
      } catch(err) {}
    });

    placeMarker(L.latLng(${lat}, ${lng}));
    map.on('click', function(e) { placeMarker(e.latlng); });
  </script>
</body>
</html>
`;

export default function MapPickerScreen({ route, navigation }) {
  const { initialLocation, radius = 200 } = route.params || {};
  const [userLocation, setUserLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const coords = await getCurrentLocation();
        const loc = initialLocation || { latitude: coords.latitude, longitude: coords.longitude };
        setUserLocation(loc);
        setMarker(loc);
      } catch {
        const fallback = { latitude: 33.6844, longitude: 73.0479 };
        setUserLocation(fallback);
        setMarker(fallback);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowResults(true);
    try {
      const results = await searchLocation(searchQuery.trim());
      if (results.length === 0) {
        Alert.alert('Not Found', `No results for "${searchQuery}". Try a different name.`);
        setShowResults(false);
      } else {
        setSearchResults(results);
      }
    } catch {
      Alert.alert('Search Error', 'Could not search. Check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const latlng = { latitude: result.latitude, longitude: result.longitude };
    setMarker(latlng);
    setShowResults(false);
    setSearchQuery(result.shortName);
    setSearchResults([]);

    // Tell the WebView to fly to this location
    webviewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'flyTo', lat: ${result.latitude}, lng: ${result.longitude} })
      }));
    `);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        setMarker({ latitude: data.lat, longitude: data.lng });
        setShowResults(false);
      }
    } catch {}
  };

  const handleConfirm = () => {
    if (!marker) return Alert.alert('No location', 'Tap on the map to select a location.');
    callMapCallback(marker);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4c6ef5" />
        <Text style={styles.loaderText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search location..."
          placeholderTextColor="#a0aec0"
          value={searchQuery}
          onChangeText={(t) => { setSearchQuery(t); if (!t) setShowResults(false); }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.searchBtn, !searchQuery.trim() && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!searchQuery.trim() || searching}
        >
          {searching
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.searchBtnText}>Search</Text>}
        </TouchableOpacity>
      </View>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsDropdown}>
          <FlatList
            data={searchResults}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectResult(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.resultIcon}>📍</Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.shortName}</Text>
                  <Text style={styles.resultAddr} numberOfLines={1}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <WebView
        ref={webviewRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: buildLeafletHTML(userLocation.latitude, userLocation.longitude, radius) }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4c6ef5" />
          </View>
        )}
      />

      {/* Coords display */}
      {marker && (
        <View style={styles.coordsBar}>
          <Text style={styles.coordsText}>
            📌 {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, !marker && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmBtnText}>✓  Confirm Location</Text>
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  map: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f0f2f5' },
  loaderText: { color: '#718096', fontSize: 16 },

  // Search
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBtn: {
    backgroundColor: '#4c6ef5',
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  searchBtnDisabled: { backgroundColor: '#a0aec0' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Results dropdown
  resultsDropdown: {
    position: 'absolute',
    top: 64,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 100,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  resultIcon: { fontSize: 18 },
  resultInfo: { flex: 1 },
  resultName: { color: '#2d3748', fontWeight: '700', fontSize: 14 },
  resultAddr: { color: '#718096', fontSize: 11, marginTop: 2 },

  // Coords bar
  coordsBar: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(26,26,46,0.85)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coordsText: { color: '#fff', fontSize: 12, fontFamily: 'monospace' },

  // Confirm button
  confirmBtn: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#4c6ef5',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmBtnDisabled: { backgroundColor: '#a0aec0' },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
