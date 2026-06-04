import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getShoppingItems, addShoppingItem, toggleShoppingItem,
  deleteShoppingItem, clearCheckedItems,
} from '../services/shoppingStorage';
import { getReminders } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = ['Grocery', 'Pharmacy', 'Electronics', 'Clothing', 'Other'];

export default function ShoppingListScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [linkedZone, setLinkedZone] = useState(null);
  const [shoppingReminders, setShoppingReminders] = useState([]);

  useFocusEffect(useCallback(() => {
    getShoppingItems().then(setItems);
    getReminders().then((r) =>
      setShoppingReminders(r.filter((rem) => rem.category === 'Shopping'))
    );
  }, []));

  const handleAdd = async () => {
    if (!text.trim()) return;
    const updated = await addShoppingItem({
      name: text.trim(),
      category,
      linkedZoneId: linkedZone?.id || null,
      linkedZoneName: linkedZone?.title || null,
    });
    setItems(updated);
    setText('');
  };

  const handleToggle = async (id) => {
    setItems(await toggleShoppingItem(id));
  };

  const handleDelete = async (id) => {
    setItems(await deleteShoppingItem(id));
  };

  const handleClearChecked = () => {
    Alert.alert('Clear Checked', 'Remove all checked items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => setItems(await clearCheckedItems()) },
    ]);
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const uncheckedCount = items.length - checkedCount;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>🛒 Shopping List</Text>
            <Text style={s.headerSub}>{uncheckedCount} remaining · {checkedCount} done</Text>
          </View>
          {checkedCount > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={handleClearChecked}>
              <Text style={s.clearBtnText}>Clear done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Linked zone banner */}
        {shoppingReminders.length > 0 && (
          <View style={s.zoneBanner}>
            <Text style={s.zoneIcon}>📍</Text>
            <Text style={s.zoneText}>
              Linked to {shoppingReminders.length} shopping zone{shoppingReminders.length > 1 ? 's' : ''} — alerts fire automatically
            </Text>
          </View>
        )}

        {/* Items */}
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🛍️</Text>
              <Text style={s.emptyTitle}>Nothing on your list</Text>
              <Text style={s.emptyText}>Add items below and link them to your shopping geofences</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[s.item, item.checked && s.itemChecked]}>
              <TouchableOpacity style={s.checkbox} onPress={() => handleToggle(item.id)}>
                <View style={[s.checkboxInner, item.checked && s.checkboxChecked]}>
                  {item.checked && <Text style={s.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={s.itemInfo}>
                <Text style={[s.itemName, item.checked && s.itemNameChecked]}>{item.name}</Text>
                <View style={s.itemMeta}>
                  <View style={[s.catTag, { backgroundColor: theme.accentLight }]}>
                    <Text style={[s.catTagText, { color: theme.accent }]}>{item.category}</Text>
                  </View>
                  {item.linkedZoneName && (
                    <Text style={s.linkedZone}>📍 {item.linkedZoneName}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Add Item */}
        <View style={[s.addBox, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {/* Category picker */}
          <View style={s.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, category === cat && s.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[s.catChipText, category === cat && s.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Link to shopping zone */}
          {shoppingReminders.length > 0 && (
            <View style={s.linkRow}>
              <Text style={[s.linkLabel, { color: theme.textSub }]}>Link to zone:</Text>
              <TouchableOpacity
                style={[s.linkChip, linkedZone && { borderColor: theme.accent, backgroundColor: theme.accentLight }]}
                onPress={() => {
                  if (linkedZone) { setLinkedZone(null); return; }
                  setLinkedZone(shoppingReminders[0]);
                }}
              >
                <Text style={[s.linkChipText, { color: linkedZone ? theme.accent : theme.textMuted }]}>
                  {linkedZone ? `📍 ${linkedZone.title}` : 'None'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Add item..."
              placeholderTextColor={theme.textMuted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[s.addBtn, !text.trim() && s.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!text.trim()}
            >
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
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
  zoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.accentLight, margin: 12,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.accent,
  },
  zoneIcon: { fontSize: 18 },
  zoneText: { color: theme.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: theme.textSub, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: theme.border,
  },
  itemChecked: { opacity: 0.55 },
  checkbox: { padding: 2 },
  checkboxInner: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: theme.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { color: '#fff', fontWeight: '800', fontSize: 13 },
  itemInfo: { flex: 1 },
  itemName: { color: theme.text, fontSize: 15, fontWeight: '600' },
  itemNameChecked: { textDecorationLine: 'line-through', color: theme.textMuted },
  itemMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  catTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  catTagText: { fontSize: 11, fontWeight: '700' },
  linkedZone: { color: theme.textSub, fontSize: 11 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: theme.danger, fontSize: 16, fontWeight: '700' },
  addBox: {
    borderTopWidth: 1, padding: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
  },
  catRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: theme.card2, borderWidth: 1, borderColor: theme.border,
  },
  catChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  catChipText: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  linkLabel: { fontSize: 13, fontWeight: '600' },
  linkChip: {
    borderRadius: 8, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  linkChipText: { fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15 },
  addBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: theme.border },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
