import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function MatchesScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      fetchMatches();
    }
  }, [session]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches().finally(() => setRefreshing(false));
  }, [session]);

  const fetchMatches = async () => {
    // Only show the full page loader on the initial load
    if (!refreshing) {
      setLoading(true);
    }
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // First, get the current user's group ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData?.group_id) {
      setLoading(false);
      return; // User might not have a group yet
    }
    const myGroupId = profileData.group_id;

    // Fetch all match details using our new view
    const { data, error } = await supabase
      .from('match_details')
      .select('*')
      .or(`group_1.eq.${myGroupId},group_2.eq.${myGroupId}`);

    if (error) {
      Alert.alert('Error', 'Failed to fetch matches.');
      console.error(error);
    } else {
      // Determine the other group's name for each match
      const formattedMatches = data.map(match => ({
        ...match,
        other_group_name: match.group_1 === myGroupId ? match.group_2_name : match.group_1_name,
      }));
      setMatches(formattedMatches);
    }
    
    setLoading(false);
  };

  if (loading) {
    return <View style={styles.container}><Text>Loading matches...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.matchItem} 
            onPress={() => router.push(`/chat/${item.match_id}`)}>
            <Text style={styles.matchText}>Chat with {item.other_group_name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>You have no matches yet.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
  matchItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  matchText: {
    fontSize: 18,
  },
});
