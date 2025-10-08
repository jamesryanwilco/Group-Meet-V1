import { View, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Button title="Edit Profile" onPress={() => router.push('/profile/edit')} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
