import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Users, MessageSquarePlus, Bell, Settings, MessageSquareText } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getRosterLabel } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "light"} backgroundColor={isDark ? '#0B0909' : '#003C24'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#002818',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#333333' : '#012d1c',
            height: 85,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarActiveTintColor: isDark ? '#8C8C8C' : '#eddfcc',
          tabBarInactiveTintColor: isDark ? '#666666' : '#f0f0f0',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: `My ${getRosterLabel()}`,
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scheduler"
          options={{
            title: 'Scheduler',
            tabBarIcon: ({ size, color }) => (
              <MessageSquareText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'ARMi',
            tabBarIcon: ({ size, color }) => (
              <MessageSquarePlus size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
            tabBarIcon: ({ size, color }) => (
              <Bell size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}