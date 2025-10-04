import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for creating a group
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetchProfileAndGroup();
    }
  }, [session]);

  const fetchProfileAndGroup = async (retries = 3) => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // If it's a "0 rows" error and we still have retries left
      if (profileError.code === 'PGRST116' && retries > 0) {
        console.log(`Profile not found, retrying... Attempts left: ${retries - 1}`);
        // Wait 1 second before trying again
        setTimeout(() => fetchProfileAndGroup(retries - 1), 1000);
        return; // Exit here to wait for the retry
      } else {
        Alert.alert('Error', 'Failed to fetch user profile.');
        console.error(profileError);
        setLoading(false);
      }
    } else {
      setProfile(profileData);
      // If user has a group, fetch group details
      if (profileData?.group_id) {
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', profileData.group_id)
          .single();

        if (groupError) {
          Alert.alert('Error', 'Failed to fetch group details.');
          console.error(groupError);
        } else {
          setGroup(groupData);
        }
      }
      setLoading(false);
    }
  };

  const goActive = async () => {
    if (!group) return;

    const expiresIn = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    const activeUntil = new Date(Date.now() + expiresIn).toISOString();

    const { error } = await supabase
      .from('groups')
      .update({ is_active: true, active_until: activeUntil })
      .eq('id', group.id);

    if (error) {
      Alert.alert('Error', 'Failed to activate group.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Your group is now active for 4 hours!');
      fetchProfileAndGroup(); // Refresh data
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    // Call the RPC function to create the group and update the profile
    const { error } = await supabase.rpc('create_new_group', {
      group_name: groupName,
      group_bio: groupBio,
    });

    if (error) {
      Alert.alert('Error', 'Failed to create group.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Group created successfully!');
      // Refetch data to show the new group view
      fetchProfileAndGroup();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // If user is in a group, display group info
  if (group) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Group</Text>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text>{group.bio}</Text>

        {group.is_active ? (
          <View style={styles.activeContainer}>
            <Text style={styles.activeText}>Your group is currently active!</Text>
            <Text>Expires at: {new Date(group.active_until).toLocaleTimeString()}</Text>
            <Button title="Go to Swiping" onPress={() => router.push('/matching')} />
          </View>
        ) : (
          <Button title="Go Active for 4 Hours" onPress={goActive} />
        )}
      </View>
    );
  }

  // If user is not in a group, display create group form
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
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  activeContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0ffe0',
    borderRadius: 10,
  },
  activeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
});
