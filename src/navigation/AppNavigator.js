/**
 * AppNavigator - Main navigation container
 * Handles auth flow and screen navigation
 */

import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, SheetSelectionScreen, HomeScreen } from '../screens';
import { isAuthenticated, clearAuthState } from '../services/googleAuth';
import { getSelectedSheet, clearSelectedSheet } from '../services/googleSheets';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Screen names as constants
export const SCREENS = {
  LOGIN: 'Login',
  SHEET_SELECTION: 'SheetSelection',
  HOME: 'Home',
};

export default function AppNavigator() {
  const [authState, setAuthState] = useState({
    isLoggedIn: isAuthenticated(),
    hasSelectedSheet: !!getSelectedSheet().fileId,
  });

  const handleLoginSuccess = useCallback((user) => {
    setAuthState({
      isLoggedIn: true,
      hasSelectedSheet: false,
    });
  }, []);

  const handleSheetSelected = useCallback((sheet) => {
    setAuthState({
      isLoggedIn: true,
      hasSelectedSheet: true,
    });
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthState();
    clearSelectedSheet();
    setAuthState({
      isLoggedIn: false,
      hasSelectedSheet: false,
    });
  }, []);

  const handleChangeSheet = useCallback(() => {
    clearSelectedSheet();
    setAuthState({
      isLoggedIn: true,
      hasSelectedSheet: false,
    });
  }, []);

  // Determine initial route based on auth state
  const getInitialRouteName = () => {
    if (!authState.isLoggedIn) {
      return SCREENS.LOGIN;
    }
    if (!authState.hasSelectedSheet) {
      return SCREENS.SHEET_SELECTION;
    }
    return SCREENS.HOME;
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {!authState.isLoggedIn ? (
          <Stack.Screen name={SCREENS.LOGIN}>
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
        ) : !authState.hasSelectedSheet ? (
          <Stack.Screen name={SCREENS.SHEET_SELECTION}>
            {(props) => (
              <SheetSelectionScreen
                {...props}
                onSheetSelected={handleSheetSelected}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name={SCREENS.HOME}>
            {(props) => (
              <HomeScreen
                {...props}
                onChangeSheet={handleChangeSheet}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
