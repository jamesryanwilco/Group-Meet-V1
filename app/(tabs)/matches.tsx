import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

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
    if (!refreshing) {
      setLoading(true);
    }
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_match_list_details');

    if (error) {
      Alert.alert('Error', 'Failed to fetch matches.');
    } else {
      setMatches(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchItem}
            onPress={() => router.push(`/chat/${item.match_id}`)}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={
                  item.my_group_photo
                    ? { uri: item.my_group_photo }
                    : require('../../assets/placeholder-avatar.png')
                }
                style={[styles.avatar, styles.myAvatar]}
              />
              <Image
                source={
                  item.other_group_photo
                    ? { uri: item.other_group_photo }
                    : require('../../assets/placeholder-avatar.png')
                }
                style={[styles.avatar, styles.otherAvatar]}
              />
            </View>
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
                {item.last_message_content || `You matched with ${item.other_group_name}!`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>No Matches Yet</Text>
            <Text style={styles.emptySubText}>
              When you and another group like each other, you'll find your match here.
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Match Item Styles
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    height: 50,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  myAvatar: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  otherAvatar: {
    position: 'absolute',
    right: 0,
  },
  matchContent: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  groupName: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.body,
  },
  lastMessage: {
    fontSize: theme.typography.fontSizes.s,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.body,
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.m,
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text,
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: theme.spacing.s,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.textSecondary,
    maxWidth: '80%',
  },
});
