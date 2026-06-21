import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import FinancialScreen from '../screens/FinancialScreen';
import ChildrenScreen  from '../screens/ChildrenScreen';
import ShoppingScreen  from '../screens/ShoppingScreen';
import CalendarScreen  from '../screens/CalendarScreen';
import SettingsScreen  from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Mapeamento de ícones por aba
const TAB_ICONS = {
  Finanças:      { active: 'wallet',          inactive: 'wallet-outline' },
  Filhos:        { active: 'people',           inactive: 'people-outline' },
  Compras:       { active: 'cart',             inactive: 'cart-outline' },
  Calendário:    { active: 'calendar',         inactive: 'calendar-outline' },
  Configurações: { active: 'settings',         inactive: 'settings-outline' },
};

export default function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary:    colors.primary,
          background: colors.background,
          card:       colors.surface,
          text:       colors.text,
          border:     colors.border,
          notification: colors.secondary,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor:  colors.border,
            paddingBottom:   8,
            paddingTop:      4,
            height:          62,
          },
          tabBarLabelStyle: {
            fontSize:   10,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const name  = focused ? icons.active : icons.inactive;
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Finanças"      component={FinancialScreen} />
        <Tab.Screen name="Filhos"        component={ChildrenScreen}  />
        <Tab.Screen name="Compras"       component={ShoppingScreen}  />
        <Tab.Screen name="Calendário"    component={CalendarScreen}  />
        <Tab.Screen name="Configurações" component={SettingsScreen}  />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
