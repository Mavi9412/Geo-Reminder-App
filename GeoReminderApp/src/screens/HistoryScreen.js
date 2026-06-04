import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory, clearHistory } from '../services/historyStorage';
import { useTheme } from '../context/ThemeContext';

const formatTime = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

const formatTimeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function HistoryScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [logs, setLogs] = useState([]);

  useFocusEffect(useCallback(() => {
    getHistory().then(setLogs);
  }, []));

  const handleClear = () => {
    Alert.alert('Clear History', 'Delete all trigger logs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => { await clearHistory(); setLogs([]); },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>🕒 History</Text>
          <Text style={s.headerSub}>{logs.length} trigger{logs.length !== 1 ? 's' : ''} logged</Text>
        </View>
        {logs.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={handleClear}>
            <Text style={s.clearBtnText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={logs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No history yet</Text>
            <Text style={s.emptyText}>
              Trigger logs will appear here when your reminders fire
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const { date, time } = formatTime(item.timestamp);
          const ago = formatTimeAgo(item.timestamp);
          const isArrival = item.triggerType === 'arrival';
          const prevItem = logs[index - 1];
          const prevDate = prevItem ? formatTime(prevItem.timestamp).date : null;
          const showDateHeader = date !== prevDate;

          return (
            <>
              {showDateHeader && (
                <View style={s.dateHeader}>
                  <View style={s.dateLine} />
                  <Text style={s.dateText}>{date}</Text>
                  <View style={s.dateLine} />
                </View>
              )}
              <View style={s.logCard}>
                <View style={[s.triggerIcon, { backgroundColor: isArrival ? 'rgba(72,187,120,0.15)' : 'rgba(229,62,62,0.15)' }]}>
                  <Text style={s.triggerEmoji}>{isArrival ? '🟢' : '🔴'}</Text>
                </View>
                <View style={s.logInfo}>
                  <Text style={s.logTitle} numberOfLines={1}>{item.reminderTitle}</Text>
                  <Text style={[s.logType, { color: isArrival ? theme.success : theme.danger }]}>
                    {isArrival ? 'Arrived' : 'Departed'}
                  </Text>
                  <Text style={s.logCoords}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={s.logTime}>
                  <Text style={s.logTimeMain}>{time}</Text>
                  <Text style={s.logTimeAgo}>{ago}</Text>
                </View>
              </View>
            </>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  headerTitle: { color: theme.text, fontSize: 22, fontWeight: '800' },
  headerSub: { color: theme.textSub, fontSize: 13, marginTop: 3 },
  clearBtn: {
    backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  clearBtnText: { color: theme.danger, fontWeight: '700', fontSize: 13 },
  list: { padding: 14, paddingBottom: 30 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dateText: { color: theme.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  logCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: theme.border,
  },
  triggerIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  triggerEmoji: { fontSize: 20 },
  logInfo: { flex: 1 },
  logTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
  logType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  logCoords: { color: theme.textMuted, fontSize: 11, marginTop: 3, fontFamily: 'monospace' },
  logTime: { alignItems: 'flex-end' },
  logTimeMain: { color: theme.text, fontSize: 13, fontWeight: '700' },
  logTimeAgo: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: theme.textSub, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
});
