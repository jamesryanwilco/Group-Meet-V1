import { View, Text, TextInput, Button, Alert, StyleSheet, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AvatarUploader from '../components/AvatarUploader';
import { useAuth } from '../../providers/SessionProvider';

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
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <AvatarUploader onUpload={(url) => setAvatarUrl(url)} />

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />

      <Button title="Save Changes" onPress={handleUpdate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
