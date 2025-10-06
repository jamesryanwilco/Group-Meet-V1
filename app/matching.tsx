import { View, Text, StyleSheet, Button, Alert, Image } from 'react-native';
import { useAuth } from '../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

export default function MatchingScreen() {
  const { group_id: swipingGroupId } = useLocalSearchParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  useEffect(() => {
    if (typeof swipingGroupId !== 'string') {
      Alert.alert('Error', 'No group selected for swiping.');
      router.back();
      return;
    }
    fetchActiveGroups(swipingGroupId);
  }, [swipingGroupId]);

  const fetchActiveGroups = async (myGroupId: string) => {
    // Call the RPC function to get a clean list of groups to swipe on.
    // All filtering is now handled on the backend.
    const { data, error } = await supabase
      .rpc('get_groups_for_swiping', { p_swiping_group_id: myGroupId });

    if (error) {
      Alert.alert('Error', 'Failed to fetch active groups.');
      console.error(error);
    } else {
      setGroups(data);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (typeof swipingGroupId !== 'string' || currentGroupIndex >= groups.length) return;

    const swipedGroup = groups[currentGroupIndex];

    // Record the swipe in the database
    const { error } = await supabase.from('swipes').insert({
      swiper_group_id: swipingGroupId,
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
        if (didMatch) return;
      }
      // Move to the next group
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const checkForMatch = async (swipedGroupId: string): Promise<boolean> => {
    if (typeof swipingGroupId !== 'string') return false;

    // Check if the other group has also liked us
    const { data, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_group_id', swipedGroupId)
      .eq('swiped_group_id', swipingGroupId)
      .eq('liked', true)
      .single();

    if (data && !error) {
      // It's a match!
      const { data: matchData, error: matchError } = await supabase
        .rpc('create_new_match', {
          group_1_id: swipingGroupId,
          group_2_id: swipedGroupId,
        })

      if (matchError) {
        if (matchError.code === '23505') { // Unique constraint violation
          const { data: existingMatch, error: fetchError } = await supabase
            .from('matches')
            .select('id')
            .or(`and(group_1.eq.${swipingGroupId},group_2.eq.${swipedGroupId}),and(group_1.eq.${swipedGroupId},group_2.eq.${swipingGroupId})`)
            .single();
          
          if (fetchError) {
            Alert.alert('Error', 'Failed to retrieve existing match.');
          } else if (existingMatch) {
            router.push(`/chat/${existingMatch.id}`);
            return true;
          }
        } else {
          Alert.alert('Error', 'Failed to create a match record.');
        }
      } else {
        Alert.alert("It's a Match!", 'You and the other group have liked each other.');
        router.push(`/chat/${matchData}`);
        return true;
      }
    }
    return false;
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
        {currentGroup.group_photos && currentGroup.group_photos.length > 0 ? (
          <Image source={{ uri: currentGroup.group_photos[0].photo_url }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text>No Photo</Text>
          </View>
        )}
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
  photo: {
    width: '100%',
    height: '70%',
    borderRadius: 10,
    marginBottom: 15,
  },
  photoPlaceholder: {
    width: '100%',
    height: '70%',
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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
