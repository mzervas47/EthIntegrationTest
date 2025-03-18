// Import polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
/*
// For TypeScript - declare the module to avoid type errors
declare module 'react-native-get-random-values' {
  export function getRandomValues<T extends ArrayBufferView | null>(array: T): T;
}

// Import getRandomValues function
import { getRandomValues } from 'react-native-get-random-values';

// Set up the crypto object without redefining the interface
if (typeof global.crypto !== 'object') {
  // Use type assertion to avoid conflicts with existing type definitions
  global.crypto = {
    getRandomValues,
    // TypeScript will use the existing definitions for the other properties
  } as Crypto;
} else if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = getRandomValues;
}
*/
console.log('Polyfills initialized');


