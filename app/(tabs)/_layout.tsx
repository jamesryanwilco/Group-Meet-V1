import { Tabs, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { HeaderAnimationProvider, useHeaderAnimation } from '../../providers/HeaderAnimationProvider';

const BACKGROUND_ANIMATION_END_Y = 30; // Animate background over the first 30px of scroll
const TITLE_ANIMATION_START_Y = 30; // Start title animation after 30px
const TITLE_ANIMATION_END_Y = 60; // End title animation at 60px

function AnimatedHeader() {
  const { scrollY } = useHeaderAnimation();

  const headerBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, BACKGROUND_ANIMATION_END_Y], [0, 1], 'clamp');
    return {
      opacity,
    };
  });

  return <Animated.View style={[
    {
      backgroundColor: theme.colors.card,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    headerBackgroundStyle
  ]} />;
}

function AnimatedHeaderTitle({ text }: { text: string }) {
  const { scrollY } = useHeaderAnimation();

  const titleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [TITLE_ANIMATION_START_Y, TITLE_ANIMATION_END_Y], [0, 1], 'clamp');
    return {
      opacity,
    };
  });

  return (
    <Animated.Text
      style={[
        {
          color: theme.colors.text,
          fontFamily: theme.typography.fonts.heading,
          fontSize: 18,
        },
        titleStyle,
      ]}
    >
      {text}
    </Animated.Text>
  );
}

function TabsLayoutComponent() {
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
          headerTransparent: true,
          headerTitle: () => <AnimatedHeaderTitle text="My Groups" />,
          headerBackground: () => <AnimatedHeader />,
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
          headerTransparent: true,
          headerTitle: () => <AnimatedHeaderTitle text="Matches" />,
          headerBackground: () => <AnimatedHeader />,
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

export default function TabsLayout() {
  return (
    <HeaderAnimationProvider>
      <TabsLayoutComponent />
    </HeaderAnimationProvider>
  );
}
