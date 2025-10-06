import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');

  const joinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }

    const { error } = await supabase.rpc('join_group_with_code', {
      invite_code_to_join: inviteCode.trim().toUpperCase(),
    });

    if (error) {
      Alert.alert('Error', error.message);
      console.error(error);
    } else {
      Alert.alert('Success', 'You have successfully joined the group!');
      // Navigate back to the home screen or to the group screen
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Invite Code (e.g., BOLD-FOX-42)"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
      />
      <Button title="Join Group" onPress={joinGroup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    textAlign: 'center',
  },
});
