// components/ScreenWithBackHandler.js
import React, { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const ScreenWithBackHandler = ({ children, onBack }) => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (onBack) {
          onBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [onBack])
  );

  return children;
};

export default ScreenWithBackHandler;

