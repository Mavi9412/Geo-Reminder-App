import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { requestLocationPermission, startTracking, stopTracking } from './src/services/locationTracker';
import { requestNotificationPermission } from './src/services/notifications';
import { getLocationPrefs } from './src/services/settingsStorage';

function AppContent() {
  useEffect(() => {
    (async () => {
      const notifGranted = await requestNotificationPermission();
      if (!notifGranted) {
        Alert.alert('Notifications Disabled', 'Enable notifications to receive geo reminders.');
      }
      const locGranted = await requestLocationPermission();
      if (!locGranted) {
        Alert.alert('Location Required', 'Background location access is needed to trigger reminders.');
        return;
      }
      startTracking();
    })();
    return () => stopTracking();
  }, []);

  return <AppNavigator />;
}

export default function App() {
  const [step, setStep] = useState('splash'); // splash | onboarding | app

  const handleSplashDone = async () => {
    const prefs = await getLocationPrefs();
    // If country not set yet → show onboarding, else go straight to app
    if (!prefs.country) {
      setStep('onboarding');
    } else {
      setStep('app');
    }
  };

  return (
    <ThemeProvider>
      {step === 'splash' && <SplashScreen onDone={handleSplashDone} />}
      {step === 'onboarding' && <OnboardingScreen onDone={() => setStep('app')} />}
      {step === 'app' && <AppContent />}
    </ThemeProvider>
  );
}
