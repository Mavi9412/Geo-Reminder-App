import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, StatusBar, ScrollView, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReminders, deleteReminder, toggleReminder } from '../services/storage';
import { setSimulatedLocation, runCheckNow, clearSimulatedLocation } from '../services/locationTracker';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = ['All', 'Shopping', 'Office', 'Personal', 'Travel'];

const CATEGORY_COLORS = {
  Shopping: '#48bb78',
  Office: '#4c6ef5',
  Personal: '#ed8936',
  Travel: '#9f7aea',
};

const SIMULATOR_SPOTS = [
  { name: 'Times Square', emoji: '🗽', lat: 40.7580, lng: -73.9855 },
  { name: 'Metro Store', emoji: '🛒', lat: 33.7294, lng: 73.0931 },
  { name: 'University Gate', emoji: '🎓', lat: 33.6938, lng: 73.0652 },
  { name: 'My Location', emoji: '📍', lat: null, lng: null },
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [reminders, setReminders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [simActive, setSimActive] = useState(null);

  const load = async () => {
    const data = await getReminders();
    setReminders(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const activeCount = reminders.filter((r) => r.enabled).length;
  const triggeredCount = reminders.filter((r) => r.triggered).length;

  const filtered = activeCategory === 'All'
    ? reminders
    : reminders.filter((r) => r.category === activeCategory);

  const handleDelete = (id) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => setReminders(await deleteReminder(id)),
      },
    ]);
  };

  const handleToggle = async (id) => {
    setReminders(await toggleReminder(id));
  };

  const handleSimulate = async (spot) => {
    if (simActive === spot.name) {
      clearSimulatedLocation();
      setSimActive(null);
      Alert.alert('Simulator Off', 'Back to real GPS location.');
      return;
    }
    if (spot.lat === null) {
      clearSimulatedLocation();
      setSimActive(null);
      return;
    }
    setSimulatedLocation({ latitude: spot.lat, longitude: spot.lng });
    setSimActive(spot.name);
    await runCheckNow();
    Alert.alert(`📍 Teleported!`, `Simulating location at ${spot.name}.\nReminder checks running now.`);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.header} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>GeoReminder AI</Text>
            <Text style={s.headerSub}>Your smart location assistant</Text>
          </View>
          <TouchableOpacity style={s.aiPill} onPress={() => navigation.navigate('AIReminder')}>
            <Text style={s.aiPillText}>🤖 AI</Text>
          </TouchableOpacity>
        </View>

        {/* Bento Metrics */}
        <View style={s.bentoRow}>
          <View style={[s.bentoCard, s.bentoBig, { backgroundColor: theme.accent }]}>
            <Text style={s.bentoNum}>{activeCount}</Text>
            <Text style={s.bentoLabel}>Active{'\n'}Geofences</Text>
            <Text style={s.bentoIcon}>🟢</Text>
          </View>
          <View style={s.bentoCol}>
            <View style={[s.bentoCard, s.bentoSmall, { backgroundColor: theme.card2, borderColor: theme.border }]}>
              <Text style={[s.bentoNum, { color: theme.text }]}>{reminders.length}</Text>
              <Text style={[s.bentoLabel, { color: theme.textSub }]}>Total</Text>
            </View>
            <View style={[s.bentoCard, s.bentoSmall, { backgroundColor: '#48bb78' }]}>
              <Text style={s.bentoNum}>{triggeredCount}</Text>
              <Text style={s.bentoLabel}>Triggered</Text>
            </View>
          </View>
        </View>

        {/* Proximity Simulator */}
        <View style={[s.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>⚡ Proximity Simulator</Text>
            {simActive && (
              <View style={s.simBadge}>
                <Text style={s.simBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          <Text style={[s.sectionSub, { color: theme.textSub }]}>Teleport to test your triggers instantly</Text>
          <View style={s.simGrid}>
            {SIMULATOR_SPOTS.map((spot) => (
              <TouchableOpacity
                key={spot.name}
                style={[s.simChip, simActive === spot.name && s.simChipActive]}
                onPress={() => handleSimulate(spot)}
                activeOpacity={0.75}
              >
                <Text style={s.simEmoji}>{spot.emoji}</Text>
                <Text style={[s.simName, simActive === spot.name && s.simNameActive]}>
                  {spot.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[s.catChip, activeCategory === cat && s.catChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[s.catText, activeCategory === cat && s.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reminders Feed */}
        <Text style={[s.feedTitle, { color: theme.textSub }]}>
          {filtered.length} reminder{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
        </Text>

        {filtered.length === 0 ? (
          <View style={[s.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={s.emptyIcon}>🗺️</Text>
            <Text style={[s.emptyTitle, { color: theme.text }]}>No reminders here</Text>
            <Text style={[s.emptyText, { color: theme.textSub }]}>
              Tap + to add your first location reminder
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }, !item.enabled && s.cardDisabled]}>
              <View style={s.cardTop}>
                <View style={[s.catDot, { backgroundColor: CATEGORY_COLORS[item.category] || theme.accent }]} />
                <Text style={[s.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggle(item.id)}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#fff"
                />
              </View>
              <View style={s.cardMeta}>
                <Text style={[s.cardDetail, { color: theme.textSub }]}>
                  {item.trigger === 'arrival' ? '🟢 Arrival' : '🔴 Exit'} · {item.radius >= 1000 ? `${item.radius / 1000}km` : `${item.radius}m`}
                </Text>
                <Text style={[s.cardDetail, { color: theme.textMuted }]}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </View>
              {item.triggered && (
                <View style={s.triggeredBadge}>
                  <Text style={s.triggeredText}>✓ Triggered</Text>
                </View>
              )}
              <View style={s.cardActions}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: theme.accentLight }]}
                  onPress={() => navigation.navigate('CreateReminder', { reminder: item })}>
                  <Text style={[s.actionBtnText, { color: theme.accent }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(229,62,62,0.1)' }]}
                  onPress={() => handleDelete(item.id)}>
                  <Text style={[s.actionBtnText, { color: theme.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateReminder', {})} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 16, paddingBottom: 90 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 40, paddingBottom: 20,
  },
  headerTitle: { color: theme.text, fontSize: 24, fontWeight: '800' },
  headerSub: { color: theme.textSub, fontSize: 13, marginTop: 2 },
  aiPill: {
    backgroundColor: theme.accentLight,
    borderWidth: 1, borderColor: theme.accent,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  aiPillText: { color: theme.accent, fontWeight: '700', fontSize: 13 },

  // Bento
  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  bentoCol: { flex: 1, gap: 10 },
  bentoCard: {
    borderRadius: 16, padding: 16, justifyContent: 'flex-end',
    borderWidth: 1, borderColor: 'transparent',
  },
  bentoBig: { flex: 1.4, minHeight: 130 },
  bentoSmall: { flex: 1 },
  bentoNum: { color: '#fff', fontSize: 32, fontWeight: '800' },
  bentoLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  bentoIcon: { position: 'absolute', top: 12, right: 12, fontSize: 22 },

  // Simulator
  section: {
    borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  sectionSub: { fontSize: 12, marginBottom: 12 },
  simBadge: {
    backgroundColor: '#48bb78', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  simBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  simGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.card2, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.border,
  },
  simChipActive: {
    backgroundColor: theme.accentLight,
    borderColor: theme.accent,
  },
  simEmoji: { fontSize: 16 },
  simName: { color: theme.textSub, fontSize: 13, fontWeight: '600' },
  simNameActive: { color: theme.accent },

  // Categories
  catScroll: { marginBottom: 14 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  catText: { color: theme.textSub, fontWeight: '600', fontSize: 13 },
  catTextActive: { color: '#fff' },

  feedTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },

  // Cards
  card: {
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, elevation: 2,
  },
  cardDisabled: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  cardMeta: { gap: 2, marginBottom: 8 },
  cardDetail: { fontSize: 12 },
  triggeredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(72,187,120,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8,
  },
  triggeredText: { color: '#48bb78', fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, padding: 9, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', fontSize: 13 },

  // Empty
  empty: {
    borderRadius: 16, padding: 36, alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34 },
});
