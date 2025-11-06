// App.js
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './src/store';
import { LoadingProvider } from './src/navigation/LoadingContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigater from './src/navigation/StackNavigater';
import FlashMessage from 'react-native-flash-message';

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <LoadingProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <StackNavigater />
            <FlashMessage position="top" />
          </NavigationContainer>
        </SafeAreaProvider>
      </LoadingProvider>
    </PersistGate>
  </Provider>
);

export default App;
