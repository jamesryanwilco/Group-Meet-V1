import { View, Text, TextInput, Alert, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useGroups } from '../providers/GroupsProvider';
import { theme } from '../lib/theme';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const { fetchGroups } = useGroups();

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
      await fetchGroups();
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Invite Code</Text>
      <TextInput
        style={styles.input}
        placeholder="BOLD-FOX-42"
        placeholderTextColor={theme.colors.placeholder}
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
      />
      <Pressable style={styles.button} onPress={joinGroup}>
        <Text style={styles.buttonText}>Join Group</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  label: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.typography.fontSizes.l,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.heading,
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
});
