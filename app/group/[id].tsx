import { View, Text, StyleSheet, Button, Alert, FlatList } from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function GroupDetailsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const { session } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [isActive, setIsActive] = useState(false);

  const fetchGroupDetails = async () => {
    if (!groupId) return;
    setLoading(true);

    // Fetch group details
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      Alert.alert('Error', 'Failed to fetch group details.');
      console.error(groupError);
      setLoading(false);
      return;
    }
    setGroup(groupData);
    setIsActive(groupData.is_active);

    // Fetch members
    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('profiles(id, username)')
      .eq('group_id', groupId);

    if (membersError) {
      Alert.alert('Error', 'Failed to fetch group members.');
    } else {
      // Filter out any members where the profile might be null
      setMembers(membersData.filter((m) => m.profiles));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const createInvite = async () => {
    const { data, error } = await supabase.rpc('create_group_invite', { p_group_id: groupId });
    if (error) {
      Alert.alert('Error', 'Failed to create invite code.');
      console.error(error);
    } else {
      setInviteCode(data);
    }
  };

  const goActive = async () => {
    const { error } = await supabase.rpc('set_active_group', { p_group_id: groupId });

    if (error) {
      Alert.alert('Error', 'Failed to activate group.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Your group is now active for 4 hours!');
      setIsActive(true);
      router.push('/matching');
    }
  };

  const leaveGroup = async () => {
    Alert.alert('Confirm', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
          if (error) {
            Alert.alert('Error', 'Failed to leave group.');
          } else {
            Alert.alert('Success', 'You have left the group.');
            router.replace('/(tabs)');
          }
        },
      },
    ]);
  };

  if (loading || !group) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const isOwner = session?.user.id === group.owner_id;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.bio}>{group.bio}</Text>

      <View style={styles.membersContainer}>
        <Text style={styles.membersTitle}>Members</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.profiles.id}
          renderItem={({ item }) => <Text style={styles.memberName}>{item.profiles.username}</Text>}
        />
      </View>

      {isOwner && (
        <View style={styles.inviteContainer}>
          {!inviteCode ? (
            <Button title="Invite Friends" onPress={createInvite} />
          ) : (
            <Text selectable={true} style={styles.inviteCode}>{inviteCode}</Text>
          )}
        </View>
      )}

      {isActive ? (
        <View style={styles.activeContainer}>
          <Text style={styles.activeText}>Your group is currently active!</Text>
          <Button title="Go to Swiping" onPress={() => router.push('/matching')} />
        </View>
      ) : (
        <Button title="Go Active for 4 Hours" onPress={goActive} />
      )}

      <View style={styles.leaveButtonContainer}>
        <Button title="Leave Group" color="red" onPress={leaveGroup} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    bio: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    membersContainer: {
        marginVertical: 20,
    },
    membersTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    memberName: {
        fontSize: 18,
        paddingVertical: 5,
    },
    inviteContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    inviteCode: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
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
    leaveButtonContainer: {
        marginTop: 'auto', // Pushes the button to the bottom
        paddingVertical: 10,
    },
});
