import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useAuth } from '../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function MatchingScreen() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [myGroupId, setMyGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyGroupIdAndActiveGroups();
  }, [session]);

  const fetchMyGroupIdAndActiveGroups = async () => {
    if (!session?.user) return;

    // First, get the current user's group ID from their profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData?.group_id) {
      Alert.alert('Error', 'Could not find your group. Please try again.');
      return;
    }

    const userGroupId = profileData.group_id;
    setMyGroupId(userGroupId);

    // Then, fetch all active groups, excluding the user's own group
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('is_active', true)
      .not('id', 'eq', userGroupId); // Exclude my own group

    if (error) {
      Alert.alert('Error', 'Failed to fetch active groups.');
      console.error(error);
    } else {
      setGroups(data);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (!myGroupId || currentGroupIndex >= groups.length) return;

    const swipedGroup = groups[currentGroupIndex];

    // Record the swipe in the database
    const { error } = await supabase.from('swipes').insert({
      swiper_group_id: myGroupId,
      swiped_group_id: swipedGroup.id,
      liked: liked,
    });

    if (error) {
      Alert.alert('Error', 'Could not record your swipe.');
      console.error(error);
    } else {
      // Check for a match
      if (liked) {
        checkForMatch(swipedGroup.id);
      }
      // Move to the next group
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const checkForMatch = async (swipedGroupId: string) => {
    if (!myGroupId) return;

    // Check if the other group has also liked us
    const { data, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_group_id', swipedGroupId)
      .eq('swiped_group_id', myGroupId)
      .eq('liked', true)
      .single();

    if (data && !error) {
      Alert.alert("It's a Match!", 'You and the other group have liked each other.');
      // Here, we would create a chat room, etc.
    }
  };


  if (currentGroupIndex >= groups.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No More Groups</Text>
        <Text>You've seen all the active groups for now. Check back later!</Text>
      </View>
    );
  }

  const currentGroup = groups[currentGroupIndex];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.groupName}>{currentGroup.name}</Text>
        <Text>{currentGroup.bio}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Pass" onPress={() => handleSwipe(false)} />
        <Button title="Like" onPress={() => handleSwipe(true)} />
      </View>
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
  card: {
    width: '90%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 30,
  },
});
