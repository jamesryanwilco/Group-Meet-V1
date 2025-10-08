import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Image } from 'react-native';
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

    // Call our new RPC function to get all the data we need in one go
    const { data, error } = await supabase.rpc('get_match_list_details');

    if (error) {
      Alert.alert('Error', 'Failed to fetch matches.');
    } else {
      setMatches(data || []);
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
            <Image
              source={item.other_group_photo ? { uri: item.other_group_photo } : require('../../assets/placeholder-avatar.png')}
              style={styles.avatar}
            />
            <View style={styles.matchContent}>
              <View style={styles.matchHeader}>
                <Text style={styles.groupName}>{item.other_group_name}</Text>
                {item.last_message_sent_at && (
                  <Text style={styles.timestamp}>
                    {new Date(item.last_message_sent_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message_content || `Matched with ${item.my_group_name}`}
              </Text>
            </View>
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
    padding: 10,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'black',
  },
  matchContent: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});
