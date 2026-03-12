import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../lib/theme';

type TabIcon = keyof typeof Ionicons.glyphMap;

const TAB_ITEMS: { name: string; title: string; icon: TabIcon; iconFocused: TabIcon }[] = [
  { name: 'index', title: 'Overview', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'analytics', title: 'Analytics', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { name: 'users', title: 'Users', icon: 'people-outline', iconFocused: 'people' },
  { name: 'sessions', title: 'Sessions', icon: 'chatbubbles-outline', iconFocused: 'chatbubbles' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: fonts.sans,
          fontWeight: '600',
          fontSize: 17,
        },
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, android: 64, web: 56, default: 64 }),
          paddingBottom: Platform.select({ ios: 28, android: 8, web: 4, default: 8 }),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontWeight: '500',
          fontSize: 11,
        },
        headerShadowVisible: false,
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size ?? 22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
