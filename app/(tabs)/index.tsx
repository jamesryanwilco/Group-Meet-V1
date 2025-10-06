import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';

export default function HomeScreen() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserGroups = async () => {
    if (!session?.user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', session.user.id);

    if (error) {
      Alert.alert('Error', 'Failed to fetch your groups.');
      console.error(error);
    } else {
      setGroups(data.map((item) => item.groups));
    }
    setLoading(false);
  };

  // useFocusEffect is like useEffect, but it re-runs when the screen comes into focus.
  // This ensures the group list is fresh after creating or joining a new one.
  useFocusEffect(
    React.useCallback(() => {
      fetchUserGroups();
    }, [session])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading your groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => router.push(`/group/${item.id}`)}>
            <Text style={styles.groupName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You're not in any groups yet. Create or join one to get started!
          </Text>
        }
      />

      {session?.user?.email && (
        <Text style={styles.emailText}>
          Signed in as: {session.user.email}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Create a New Group" onPress={() => router.push('/create-group')} />
        <View style={{ marginVertical: 8 }} />
        <Button title="Join a Group" onPress={() => router.push('/join-group')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50, // Add padding to avoid notch
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  groupItem: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    paddingVertical: 20,
  },
  emailText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
    fontSize: 12,
  },
});
