import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import CreateReminderScreen from '../screens/CreateReminderScreen';
import MapPickerScreen from '../screens/MapPickerScreen';
import AIReminderScreen from '../screens/AIReminderScreen';
import MapViewScreen from '../screens/MapViewScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Map: '🗺️',
  Shopping: '🛒',
  History: '🕒',
  Settings: '⚙️',
};

function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapViewScreen} />
      <Tab.Screen name="Shopping" component={ShoppingListScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          cardStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="CreateReminder"
          component={CreateReminderScreen}
          options={({ route }) => ({
            title: route.params?.reminder ? 'Edit Reminder' : 'New Reminder',
          })}
        />
        <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ title: 'Select Location' }} />
        <Stack.Screen name="AIReminder" component={AIReminderScreen} options={{ title: '🤖 AI Reminder' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
