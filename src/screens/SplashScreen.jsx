import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeText = useRef(new Animated.Value(0)).current;
  const slideText = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    // Start text animations
    Animated.parallel([
      Animated.timing(fadeText, {
        toValue: 1,
        duration: 1000,
        delay: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideText, {
        toValue: 0,
        duration: 1000,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Login'), 4000);
    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/splash.png')}
        style={[
          styles.logo,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.Text
        style={[
          styles.appName,
          {
            opacity: fadeText,
            transform: [{ translateY: slideText }],
          },
        ]}
      >
        {/* InteliHR */}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: fadeText,
            transform: [{ translateY: slideText }],
          },
        ]}
      >
        {/* Smart HR Management System */}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcf', // clean white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});

export default SplashScreen;
