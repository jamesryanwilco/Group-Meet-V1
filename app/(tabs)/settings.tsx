import { View, StyleSheet, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.testBox, animatedStyle]}>
        <Text style={styles.testBoxText}>Reanimated is working!</Text>
      </Animated.View>

      <Pressable style={styles.menuItem} onPress={() => router.push('/profile/edit')}>
        <Ionicons name="person-circle-outline" size={24} color={theme.colors.textSecondary} />
        <Text style={styles.menuItemText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
      </Pressable>

      <Pressable style={styles.menuItem} onPress={() => supabase.auth.signOut()}>
        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
        <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  menuItem: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.radii.m,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  menuItemText: {
    flex: 1,
    marginLeft: theme.spacing.m,
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
  },
  testBox: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.l,
    alignItems: 'center',
  },
  testBoxText: {
    color: 'white',
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.fontSizes.m,
  },
});
