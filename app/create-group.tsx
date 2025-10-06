import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');

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
      // Navigate back to the home screen, which will be refreshed by useFocusEffect
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <TextInput
        style={styles.input}
        placeholder="Group Bio (Optional)"
        value={groupBio}
        onChangeText={setGroupBio}
      />
      <Button title="Create Group" onPress={createGroup} />
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
  },
});
