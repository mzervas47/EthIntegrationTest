import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Linking } from 'react-native';

// Import our global polyfills - this MUST be the first import
import './global';

import EthereumTestScreen2 from './EthereumTestScreen2';

export default function App() {
  // Log when the app starts to verify initialization
  useEffect(() => {
    console.log('App initialized');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <EthereumTestScreen2 />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
