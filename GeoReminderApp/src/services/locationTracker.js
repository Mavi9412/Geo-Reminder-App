import * as Location from 'expo-location';
import { getReminders, updateReminder } from './storage';
import { isWithinRadius } from '../utils/distance';
import { sendGeoNotification } from './notifications';
import { logTrigger } from './historyStorage';

let trackingInterval = null;
let simulatedLocation = null; // set by Proximity Simulator

export const requestLocationPermission = async () => {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  return bg === 'granted';
};

export const getCurrentLocation = async () => {
  if (simulatedLocation) return simulatedLocation;
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return location.coords;
};

export const setSimulatedLocation = (coords) => {
  simulatedLocation = coords;
};

export const clearSimulatedLocation = () => {
  simulatedLocation = null;
};

const checkReminders = async () => {
  try {
    const coords = await getCurrentLocation();
    const reminders = await getReminders();

    for (const reminder of reminders) {
      if (!reminder.enabled || reminder.triggered) continue;

      const inside = isWithinRadius(
        coords.latitude,
        coords.longitude,
        reminder.latitude,
        reminder.longitude,
        reminder.radius
      );

      if (reminder.trigger === 'arrival' && inside) {
        await sendGeoNotification(reminder);
        await logTrigger({
          reminderTitle: reminder.title,
          latitude: reminder.latitude,
          longitude: reminder.longitude,
          triggerType: 'arrival',
        });
        await updateReminder(reminder.id, { triggered: true });
      } else if (reminder.trigger === 'exit' && !inside && reminder.wasInside) {
        await sendGeoNotification(reminder);
        await logTrigger({
          reminderTitle: reminder.title,
          latitude: reminder.latitude,
          longitude: reminder.longitude,
          triggerType: 'exit',
        });
        await updateReminder(reminder.id, { triggered: true });
      } else if (inside && !reminder.wasInside) {
        await updateReminder(reminder.id, { wasInside: true });
      } else if (!inside && reminder.wasInside) {
        await updateReminder(reminder.id, { wasInside: false });
      }
    }
  } catch (e) {
    console.warn('Location check error:', e.message);
  }
};

export const startTracking = (intervalMs = 25000) => {
  if (trackingInterval) return;
  checkReminders();
  trackingInterval = setInterval(checkReminders, intervalMs);
};

export const stopTracking = () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
};

export const runCheckNow = () => checkReminders();
