import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useGroups } from '../../providers/GroupsProvider';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useHeaderAnimation } from '../../providers/HeaderAnimationProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const MemberAvatars = ({ avatars }: { avatars: (string | null)[] }) => {
  const visibleAvatars = (avatars || []).filter(Boolean).slice(0, 4);

  return (
    <View style={styles.avatarRow}>
      {visibleAvatars.map((url, index) => (
        <Image
          key={index}
          source={{ uri: url! }}
          style={[styles.memberAvatar, { marginLeft: index > 0 ? -15 : 0 }]}
        />
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const { groups, loading, fetchGroups } = useGroups();
  const [refreshing, setRefreshing] = useState(false);
  const { scrollY } = useHeaderAnimation();
  const insets = useSafeAreaInsets();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        data={groups}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.groupItem} onPress={() => router.push(`/group/${item.id}`)}>
            <Image
              source={
                item.photo_url
                  ? { uri: item.photo_url }
                  : require('../../assets/placeholder-avatar.png')
              }
              style={styles.groupPhoto}
            />
            <View style={styles.groupTextContainer}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupBio} numberOfLines={1}>
                {item.bio || 'No bio available.'}
              </Text>
              <View style={styles.membersContainer}>
                <MemberAvatars avatars={item.member_avatars} />
                <Text style={styles.memberCount}>{item.member_count} members</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>My Groups</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.placeholder} style={styles.searchIcon} />
              <TextInput
                placeholder="Search groups..."
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
                <Text style={styles.filterButtonText}>Favourite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Unread</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>You're not in any groups yet.</Text>
            <Text style={styles.emptySubText}>Create or join one to get started!</Text>
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
  },
  // Group List Item Styles
  groupItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  groupPhoto: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    marginRight: theme.spacing.m,
    backgroundColor: theme.colors.border,
  },
  groupTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text,
  },
  groupBio: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.card,
    backgroundColor: theme.colors.border,
  },
  memberCount: {
    marginLeft: theme.spacing.s,
    fontSize: theme.typography.fontSizes.xs,
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
  },
  // Action Button Styles
  buttonContainer: {
    paddingVertical: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.m,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.s,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
    marginLeft: theme.spacing.s,
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
});
