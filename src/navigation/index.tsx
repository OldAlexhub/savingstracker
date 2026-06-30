import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type { RootStackParamList, MainTabParamList } from '../types';
import { bottomInsetWithFallback } from '../utils/safeArea';

import DashboardScreen from '../screens/DashboardScreen';
import SavingsScreen from '../screens/SavingsScreen';
import DebtScreen from '../screens/DebtScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import AddSavingsGoalScreen from '../screens/savings/AddSavingsGoalScreen';
import EditSavingsGoalScreen from '../screens/savings/EditSavingsGoalScreen';
import SavingsGoalDetailScreen from '../screens/savings/SavingsGoalDetailScreen';
import SavingsStrategyScreen from '../screens/savings/SavingsStrategyScreen';
import LogContributionScreen from '../screens/savings/LogContributionScreen';

import AddDebtScreen from '../screens/debt/AddDebtScreen';
import EditDebtScreen from '../screens/debt/EditDebtScreen';
import DebtDetailScreen from '../screens/debt/DebtDetailScreen';
import DebtStrategyScreen from '../screens/debt/DebtStrategyScreen';
import LogDebtPaymentScreen from '../screens/debt/LogDebtPaymentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Dashboard: 'view-dashboard-outline',
  Savings: 'piggy-bank-outline',
  Debt: 'credit-card-outline',
  Insights: 'chart-line',
  Settings: 'cog-outline',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = bottomInsetWithFallback(insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name]} size={size ?? 22} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Savings"
        component={SavingsScreen}
        options={{ tabBarLabel: 'Savings' }}
      />
      <Tab.Screen
        name="Debt"
        component={DebtScreen}
        options={{ tabBarLabel: 'Debt' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#F5F7FA' },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddSavingsGoal"
          component={AddSavingsGoalScreen}
          options={{ title: 'Add Savings Goal' }}
        />
        <Stack.Screen
          name="EditSavingsGoal"
          component={EditSavingsGoalScreen}
          options={{ title: 'Edit Goal' }}
        />
        <Stack.Screen
          name="SavingsGoalDetail"
          component={SavingsGoalDetailScreen}
          options={({ route }) => ({
            title: route.params?.goalId ? 'Goal Details' : 'Goal Details',
          })}
        />
        <Stack.Screen
          name="SavingsStrategy"
          component={SavingsStrategyScreen}
          options={{ title: 'Savings Strategies' }}
        />
        <Stack.Screen
          name="LogContribution"
          component={LogContributionScreen}
          options={{ title: 'Log Contribution' }}
        />
        <Stack.Screen
          name="AddDebt"
          component={AddDebtScreen}
          options={{ title: 'Add Debt Account' }}
        />
        <Stack.Screen
          name="EditDebt"
          component={EditDebtScreen}
          options={{ title: 'Edit Debt' }}
        />
        <Stack.Screen
          name="DebtDetail"
          component={DebtDetailScreen}
          options={{ title: 'Debt Details' }}
        />
        <Stack.Screen
          name="DebtStrategy"
          component={DebtStrategyScreen}
          options={{ title: 'Debt Payoff Strategies' }}
        />
        <Stack.Screen
          name="LogDebtPayment"
          component={LogDebtPaymentScreen}
          options={{ title: 'Log Debt Payment' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
