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

    // 1. Get all of the user's groups
    const { data: userGroupsData, error: userGroupsError } = await supabase
      .from('group_members')
      .select('group_id, groups(name)')
      .eq('user_id', session.user.id);

    if (userGroupsError) {
      setLoading(false);
      Alert.alert('Error', 'Could not fetch your groups.');
      return;
    }
    if (userGroupsData.length === 0) {
      setLoading(false);
      return; // User is not in any groups
    }
    
    const myGroupIds = userGroupsData.map(ug => ug.group_id);
    const myGroupsMap = new Map(userGroupsData.map(ug => [ug.group_id, ug.groups.name]));

    // 2. Fetch all matches for all of those groups using our view
    const { data, error } = await supabase
      .from('match_details')
      .select('*')
      .or(`group_1.in.(${myGroupIds.join(',')}),group_2.in.(${myGroupIds.join(',')})`);

    if (error) {
      Alert.alert('Error', 'Failed to fetch matches.');
      console.error(error);
    } else {
      // 3. Determine the names for each match
      const formattedMatches = data.map(match => {
        const isGroup1Mine = myGroupsMap.has(match.group_1);
        const myGroupName = isGroup1Mine ? myGroupsMap.get(match.group_1) : myGroupsMap.get(match.group_2);
        const otherGroupName = isGroup1Mine ? match.group_2_name : match.group_1_name;
        return {
          ...match,
          my_group_name: myGroupName,
          other_group_name: otherGroupName,
        };
      });
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
            <Text style={styles.matchText}>
              <Text style={{fontWeight: 'bold'}}>{item.my_group_name}</Text>
              {' matched with '}
              <Text style={{fontWeight: 'bold'}}>{item.other_group_name}</Text>
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>You have no matches yet.</Text>}
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
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});
