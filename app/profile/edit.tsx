import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AvatarUploader from '../components/AvatarUploader';
import { useAuth } from '../../providers/SessionProvider';
import { theme } from '../../lib/theme';

const handleDeleteAccount = () => {
  Alert.alert(
    'Delete Account',
    'Are you sure you want to delete your account? This action is irreversible and will permanently delete all of your data.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('delete_user_account');
          if (error) {
            Alert.alert('Error', 'There was an error deleting your account. Please try again.');
            console.error(error);
          } else {
            Alert.alert('Success', 'Your account has been successfully deleted.', [
              {
                text: 'OK',
                onPress: async () => {
                  // Explicitly sign out to clear the session and trigger redirect
                  await supabase.auth.signOut();
                  router.replace('/sign-in');
                },
              },
            ]);
          }
        },
      },
    ]
  );
};

export default function EditProfileScreen() {
  const { session } = useAuth();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to fetch profile.');
      } else {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [session]);

  const handleUpdate = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    const { error } = await supabase.rpc('update_user_profile', {
      p_username: username.trim(),
      p_avatar_url: avatarUrl,
    });

    if (error) {
      Alert.alert('Error', 'Failed to update profile.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarContainer}>
        <AvatarUploader
          currentAvatarUrl={avatarUrl}
          onUpload={(url) => {
            setAvatarUrl(url);
            // Immediately update the profile with the new avatar
            supabase.rpc('update_user_profile', {
              p_username: username.trim(),
              p_avatar_url: url,
            });
          }}
        />
      </View>

      <Text style={styles.label}>Username</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor={theme.colors.placeholder}
          keyboardAppearance="dark"
        />
      </View>

      <Pressable style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.deleteButton]}
        onPress={handleDeleteAccount}
      >
        <Ionicons name="trash-outline" size={20} color={'white'} />
        <Text style={styles.buttonText}>Delete Account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.l,
  },
  label: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.s,
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.typography.fontSizes.m,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    marginTop: theme.spacing.l,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
});
