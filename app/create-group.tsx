import { View, Text, TextInput, Alert, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useGroups } from '../providers/GroupsProvider';
import { theme } from '../lib/theme';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const { fetchGroups } = useGroups();

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    const { error } = await supabase.rpc('create_new_group', {
      group_name: groupName.trim(),
      group_bio: groupBio.trim(),
    });

    if (error) {
      Alert.alert('Error', error.message);
      console.error(error);
    } else {
      Alert.alert('Success', 'Group created successfully!');
      // Fetch the updated list of groups for our global state
      await fetchGroups();
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter group name..."
        placeholderTextColor={theme.colors.placeholder}
        value={groupName}
        onChangeText={setGroupName}
        keyboardAppearance="dark"
      />
      <Text style={styles.label}>Group Bio (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What's your group about?"
        placeholderTextColor={theme.colors.placeholder}
        value={groupBio}
        onChangeText={setGroupBio}
        keyboardAppearance="dark"
      />
      <Pressable style={styles.button} onPress={createGroup}>
        <Text style={styles.buttonText}>Create Group</Text>
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
});
