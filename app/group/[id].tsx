import { View, Text, StyleSheet, Button, Alert, FlatList, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import ImageUploader from '../components/ImageUploader';

export default function GroupDetailsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const { session } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [isActive, setIsActive] = useState(false);

  const fetchGroupDetails = async () => {
    // Type assertion to ensure groupId is a string for the rest of the function
    if (typeof groupId !== 'string') {
      Alert.alert('Error', 'Invalid Group ID.');
      router.back();
      return;
    }

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
      setMembers(membersData.filter((m) => m.profiles));
    }
    
    // Fetch photos
    const { data: photosData, error: photosError } = await supabase
      .from('group_photos')
      .select('id, photo_url')
      .eq('group_id', groupId);

    if (photosError) {
      Alert.alert('Error', 'Failed to fetch group photos.');
    } else {
      setPhotos(photosData);
    }

    // Fetch matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('match_details')
      .select('*')
      .or(`group_1.eq.${groupId},group_2.eq.${groupId}`);

    if (matchesError) {
      Alert.alert('Error', 'Failed to fetch group matches.');
    } else {
      const formattedMatches = matchesData.map(match => ({
        ...match,
        other_group_name: match.group_1 === groupId ? match.group_2_name : match.group_1_name,
      }));
      setMatches(formattedMatches);
    }

    setLoading(false);
  };

  const deletePhoto = async (photoUrl: string) => {
    // Extract the file path from the full URL
    const filePath = photoUrl.split('/group-photos/').pop();
    if (!filePath) {
      Alert.alert('Error', 'Could not determine the file path to delete.');
      return;
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Delete the file from Storage
            const { error: storageError } = await supabase.storage
              .from('group-photos')
              .remove([filePath]);

            if (storageError) throw storageError;

            // 2. Delete the record from the database
            const { error: dbError } = await supabase
              .from('group_photos')
              .delete()
              .eq('photo_url', photoUrl);

            if (dbError) throw dbError;

            // 3. Refresh the photo list
            setPhotos(photos.filter(p => p.photo_url !== photoUrl));
            Alert.alert('Success', 'Photo deleted.');

          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete photo.');
            console.error(error);
          }
        },
      },
    ]);
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

  const activateGroup = async () => {
    const { error } = await supabase.rpc('activate_group', { p_group_id: groupId });

    if (error) {
      Alert.alert('Error', 'Failed to activate group.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Your group is now active for 4 hours!');
      setIsActive(true);
    }
  };

  const deactivateGroup = async () => {
    const { error } = await supabase.rpc('deactivate_group', { p_group_id: groupId });

    if (error) {
      Alert.alert('Error', 'Failed to deactivate group.');
      console.error(error);
    } else {
      Alert.alert('Success', 'Your group is no longer active.');
      setIsActive(false);
    }
  };

  const handleLeaveOrDelete = () => {
    const isOwner = session?.user.id === group.owner_id;
    console.log(`handleLeaveOrDelete called. User is owner: ${isOwner}`);

    if (isOwner) {
      // Logic for deleting the group
      Alert.alert('Confirm Delete', 'Are you sure you want to permanently delete this group for everyone?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log(`Attempting to call RPC: delete_group with group ID: ${groupId}`);
            const { error } = await supabase.rpc('delete_group', { p_group_id: groupId });
            if (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group.');
            } else {
              console.log('Successfully deleted group.');
              Alert.alert('Success', 'Group has been deleted.');
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } else {
      // Logic for leaving the group
      Alert.alert('Confirm Leave', 'Are you sure you want to leave this group?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            console.log(`Attempting to call RPC: leave_group with group ID: ${groupId}`);
            const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
            if (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group.');
            } else {
              console.log('Successfully left group.');
              Alert.alert('Success', 'You have left the group.');
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    }
  };

  if (loading || !group) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const isOwner = session?.user.id === group.owner_id;
  const isMember = members.some(m => m.profiles.id === session?.user.id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.bio}>{group.bio}</Text>

      {isMember && (
        <View style={styles.editButtonContainer}>
          <Button title="Edit Group" onPress={() => router.push(`/group/edit/${groupId}`)} />
        </View>
      )}

      <View>
        <Text style={styles.sectionTitle}>Photos</Text>
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Image source={{ uri: item.photo_url }} style={styles.photo} />
              {isMember && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item.photo_url)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos yet.</Text>}
        />
        {isMember && <ImageUploader groupId={groupId as string} groupPhotoUrl={group.photo_url} onUpload={fetchGroupDetails} />}
      </View>

      <View style={styles.membersContainer}>
        <Text style={styles.sectionTitle}>Matches</Text>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.matchItem}
              onPress={() => router.push(`/chat/${item.match_id}`)}>
              <Text style={styles.matchText}>- Matched with {item.other_group_name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matches for this group yet.</Text>}
        />
      </View>

      <View style={styles.membersContainer}>
        <Text style={styles.sectionTitle}>Members</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.profiles.id}
          renderItem={({ item }) => (
            <Text style={styles.memberName}>
              {item.profiles.username}
              {item.profiles.id === group.owner_id && ' (Admin)'}
            </Text>
          )}
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
          <Button title="Start Swiping" onPress={() => router.push(`/matching?group_id=${groupId}`)} />
          <View style={{ marginTop: 10 }} />
          <Button title="Go Inactive" color="red" onPress={deactivateGroup} />
        </View>
      ) : (
        <Button title="Go Active for 4 Hours" onPress={activateGroup} />
      )}

      <View style={styles.leaveButtonContainer}>
        <Button
          title={isOwner ? 'Delete Group' : 'Leave Group'}
          color="red"
          onPress={handleLeaveOrDelete}
        />
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
    editButtonContainer: {
      marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    },
    deleteButton: {
        position: 'absolute',
        top: 5,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
    },
    matchItem: {
      paddingVertical: 5,
    },
    matchText: {
      fontSize: 16,
      color: '#333',
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
