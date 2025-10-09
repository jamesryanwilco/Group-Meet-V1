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
  TextInput,
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '../../lib/utils';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useHeaderAnimation } from '../../providers/HeaderAnimationProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
interface Match {
  match_id: number;
  my_group_photo: string | null;
  other_group_photo: string | null;
  other_group_name: string;
  last_message_sent_at: string | null;
  last_message_content: string | null;
}

export default function MatchesScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { scrollY } = useHeaderAnimation();
  const insets = useSafeAreaInsets();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

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
      const sortedMatches = (data || []).sort((a: Match, b: Match) => {
        // Handle cases where one or both might not have a message yet
        if (!a.last_message_sent_at) return 1; // a goes to the bottom
        if (!b.last_message_sent_at) return -1; // b goes to the bottom

        // Sort by the most recent message timestamp
        return new Date(b.last_message_sent_at).getTime() - new Date(a.last_message_sent_at).getTime();
      });
      setMatches(sortedMatches);
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
      <AnimatedFlatList
        data={matches}
        keyExtractor={(item) => item.match_id.toString()}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
                    {formatTimestamp(item.last_message_sent_at)}
                  </Text>
                )}
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message_content || `You matched with ${item.other_group_name}!`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Matches</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
              <TextInput
                placeholder="Search matches..."
                placeholderTextColor={theme.colors.placeholder}
                style={styles.searchInput}
                keyboardAppearance="dark"
              />
            </View>
            <View style={styles.filterContainer}>
              <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
                <Text style={[styles.filterButtonText, styles.activeFilterText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Unread</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>No Matches Yet</Text>
            <Text style={styles.emptySubText}>
              When you and another group like each other, you'll find your match here.
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 50, paddingHorizontal: theme.spacing.m }}
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
    paddingHorizontal: 0, // Remove padding from container as it's now on the list
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: theme.colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    color: theme.colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Match Item Styles
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginHorizontal: -theme.spacing.m, // Counteract the padding on the content container
    paddingHorizontal: theme.spacing.m,
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
