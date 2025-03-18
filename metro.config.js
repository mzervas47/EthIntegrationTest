// Simple metro.config.js that should work
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Just add this one line for crypto
config.resolver.extraNodeModules = {
  'crypto': require.resolve('react-native-crypto')
};

module.exports = config;