import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useAuth } from '../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

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

    // Then, get a list of all group IDs this user's group has already swiped on
    const { data: swipedGroups, error: swipesError } = await supabase
      .from('swipes')
      .select('swiped_group_id')
      .eq('swiper_group_id', userGroupId);

    if (swipesError) {
      Alert.alert('Error', 'Failed to fetch your previous swipes.');
      console.error(swipesError);
      return;
    }

    const swipedGroupIds = swipedGroups.map(s => s.swiped_group_id);

    // Finally, fetch all active groups, excluding the user's own group
    // and any groups they have already swiped on.
    let query = supabase
      .from('groups')
      .select('*')
      .eq('is_active', true)
      .not('id', 'eq', userGroupId); // Exclude my own group

    // Only add the filter if there are groups to exclude
    if (swipedGroupIds.length > 0) {
      query = query.not('id', 'in', `(${swipedGroupIds.join(',')})`); // Exclude already swiped groups
    }
      
    const { data, error } = await query;

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
        const didMatch = await checkForMatch(swipedGroup.id);
        // If a match was found and we navigated away, stop here.
        if (didMatch) return;
      }
      // Move to the next group
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const checkForMatch = async (swipedGroupId: string): Promise<boolean> => {
    if (!myGroupId) return false;

    // Check if the other group has also liked us
    const { data, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_group_id', swipedGroupId)
      .eq('swiped_group_id', myGroupId)
      .eq('liked', true)
      .single();

    if (data && !error) {
      // It's a match! Call the RPC function to create a new match record.
      const { data: matchData, error: matchError } = await supabase
        .rpc('create_new_match', {
          group_1_id: myGroupId,
          group_2_id: swipedGroupId,
        })

      if (matchError) {
        // Error code '23505' is for unique constraint violation
        if (matchError.code === '23505') {
          // A match already exists, so we need to find it and navigate to it.
          const { data: existingMatch, error: fetchError } = await supabase
            .from('matches')
            .select('id')
            .or(`and(group_1.eq.${myGroupId},group_2.eq.${swipedGroupId}),and(group_1.eq.${swipedGroupId},group_2.eq.${myGroupId})`)
            .single();
          
          if (fetchError) {
            Alert.alert('Error', 'Failed to retrieve existing match.');
            console.error(fetchError);
          } else if (existingMatch) {
            router.push(`/chat/${existingMatch.id}`);
            return true;
          }
        } else {
          Alert.alert('Error', 'Failed to create a match record.');
          console.error(matchError);
        }
      } else {
        Alert.alert("It's a Match!", 'You and the other group have liked each other.');
        // Navigate to the chat screen for the new match
        router.push(`/chat/${matchData}`);
        return true; // Indicate that a match was found and we navigated
      }
    }
    return false; // No match was found
  };


  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Looking for groups...</Text>
        <Text>There are no active groups right now. Check back soon!</Text>
      </View>
    );
  }

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
