import { Tabs, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.heading,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Groups',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 16, gap: 16 }}>
              <Pressable onPress={() => router.push('/create-group')}>
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              </Pressable>
              <Pressable onPress={() => router.push('/join-group')}>
                <Ionicons name="enter-outline" size={24} color={theme.colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
