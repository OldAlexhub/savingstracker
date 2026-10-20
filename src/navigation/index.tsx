import React, {useCallback} from 'react';
import {BackHandler, StyleSheet} from 'react-native';
import {NavigationContainer, useFocusEffect, useNavigation} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {createBottomTabNavigator, type BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type { RootStackParamList, MainTabParamList } from '../types';
import { bottomInsetWithFallback } from '../utils/safeArea';
import {Colors} from '../theme';

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
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        const index = navigation.getState().index;
        if (index !== 0) {
          navigation.navigate('Dashboard');
        }
        return true;
      });
      return () => subscription.remove();
    }, [navigation]),
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, focused }) => (
          <Icon name={TAB_ICONS[route.name]} size={focused ? 24 : 22} color={color} />
        ),
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 7,
          elevation: 14,
          shadowColor: '#12352B',
          shadowOpacity: 0.08,
          shadowRadius: 12,
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
        options={{ tabBarLabel: 'Goals' }}
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
          headerStyle: { backgroundColor: '#0A2B24' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
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

const styles = StyleSheet.create({
  tabLabel: {fontSize: 10, fontWeight: '600', marginTop: 1},
  tabItem: {paddingTop: 1},
});
