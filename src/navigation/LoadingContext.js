// LoadingContext.js
import React, { createContext, useState, useContext } from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingContext = createContext({ loading: false, setLoading: () => {} });

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      <Modal transparent visible={loading}>
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      </Modal>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
