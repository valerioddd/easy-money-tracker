/**
 * Easy Money Tracker - Main Application Entry Point
 * Integrates Google OAuth authentication and sheet selection flow
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
