import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ onDone }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(onDone, 800);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        GeoReminder AI
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Smart location-based reminders
      </Animated.Text>

      <Animated.View style={[styles.dots, { opacity: tagOpacity }]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(76,110,245,0.08)',
    top: '50%',
    left: '50%',
    marginTop: -150,
    marginLeft: -150,
  },
  logoWrap: { marginBottom: 28 },
  logoOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(76,110,245,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(76,110,245,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4c6ef5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#4c6ef5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  logoIcon: { fontSize: 36 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#a0aec0',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d2d4e',
  },
  dotActive: { backgroundColor: '#4c6ef5' },
});
