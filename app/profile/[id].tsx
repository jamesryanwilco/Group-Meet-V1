import { View, Text, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

interface Profile {
  username: string;
  avatar_url: string;
}

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || typeof userId !== 'string') return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to fetch user profile.');
        console.error(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.username}>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={
          profile.avatar_url
            ? { uri: profile.avatar_url }
            : require('../../assets/placeholder-avatar.png')
        }
        style={styles.avatar}
      />
      <Text style={styles.username}>{profile.username}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: theme.spacing.l,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  username: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text,
  },
});

