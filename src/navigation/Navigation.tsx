/**
 * Navigation.tsx - Bottom tab navigation configuration
 * 
 * Provides main app navigation with 4 tabs:
 * - Movements: Transaction management
 * - Accounts: Account/Net Worth view
 * - Charts: Data visualization
 * - Settings: App configuration
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MovementScreen, AccountScreen, ChartsScreen, SettingsScreen } from '../screens';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();

// Minimal icon components using Unicode symbols
const MovementsIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <Text style={[styles.icon, { fontSize: size, color: focused ? colors.income : colors.textSecondary }]}>
    💸
  </Text>
);

const AccountsIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <Text style={[styles.icon, { fontSize: size, color: focused ? colors.income : colors.textSecondary }]}>
    💰
  </Text>
);

const ChartsIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <Text style={[styles.icon, { fontSize: size, color: focused ? colors.income : colors.textSecondary }]}>
    📊
  </Text>
);

const SettingsIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <Text style={[styles.icon, { fontSize: size, color: focused ? colors.income : colors.textSecondary }]}>
    ⚙️
  </Text>
);

interface BottomTabNavigatorProps {
  onLogout?: () => void;
  onChangeSheet?: () => void;
}

export default function BottomTabNavigator({ onLogout, onChangeSheet }: BottomTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.income,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.fontSizeSmall,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Movements"
        options={{
          tabBarLabel: 'Movements',
          tabBarIcon: MovementsIcon,
          tabBarAccessibilityLabel: 'Movements tab - View and manage transactions',
        }}
      >
        {(props) => (
          <MovementScreen
            {...props}
            onLogout={onLogout}
            onChangeSheet={onChangeSheet}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Accounts"
        options={{
          tabBarLabel: 'Net Worth',
          tabBarIcon: AccountsIcon,
          tabBarAccessibilityLabel: 'Accounts tab - View accounts and net worth',
        }}
        component={AccountScreen}
      />

      <Tab.Screen
        name="Charts"
        options={{
          tabBarLabel: 'Charts',
          tabBarIcon: ChartsIcon,
          tabBarAccessibilityLabel: 'Charts tab - View financial charts and analytics',
        }}
        component={ChartsScreen}
      />

      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: SettingsIcon,
          tabBarAccessibilityLabel: 'Settings tab - Configure app settings',
        }}
      >
        {() => (
          <SettingsScreen
            onLogout={onLogout}
            onChangeSheet={onChangeSheet}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
