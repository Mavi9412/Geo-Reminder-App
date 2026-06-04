import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const sendGeoNotification = async (reminder) => {
  const body =
    reminder.trigger === 'arrival'
      ? `You have arrived near "${reminder.title}" location!`
      : `You have left "${reminder.title}" location!`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📍 Geo Reminder`,
      body,
      sound: true,
    },
    trigger: null, // immediate
  });
};
