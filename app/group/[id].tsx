import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../../lib/theme';

export default function GroupDetailsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const { session } = useAuth();
  const navigation = useNavigation();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof groupId !== 'string') return;

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push(`/group/edit/${groupId}`)}>
          <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, groupId]);

  const fetchGroupDetails = async () => {
    if (typeof groupId !== 'string') {
      Alert.alert('Error', 'Invalid Group ID.');
      router.back();
      return;
    }
    setLoading(true);
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      Alert.alert('Error', 'Failed to fetch group details.');
      setLoading(false);
      return;
    }
    setGroup(groupData);
    setIsActive(groupData.is_active);

    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('profiles(id, username, avatar_url)')
      .eq('group_id', groupId);
    if (membersError) Alert.alert('Error', 'Failed to fetch group members.');
    else setMembers(membersData.filter((m) => m.profiles));

    const { data: matchesData, error: matchesError } = await supabase
      .from('match_details')
      .select('*')
      .or(`group_1.eq.${groupId},group_2.eq.${groupId}`);
    if (matchesError) Alert.alert('Error', 'Failed to fetch group matches.');
    else {
      const formattedMatches = matchesData.map((match) => ({
        ...match,
        other_group_name: match.group_1 === groupId ? match.group_2_name : match.group_1_name,
      }));
      setMatches(formattedMatches);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const createInvite = async () => {
    const { data, error } = await supabase.rpc('create_group_invite', { p_group_id: groupId });
    if (error) Alert.alert('Error', 'Failed to create invite code.');
    else {
      Alert.alert('Invite Code', data, [
        {
          text: 'Copy',
          onPress: async () => {
            await Clipboard.setStringAsync(data);
            Alert.alert('Copied!', 'Invite code copied to clipboard.');
          },
        },
        { text: 'OK' },
      ]);
    }
  };

  const activateGroup = async () => {
    const { error } = await supabase.rpc('activate_group', { p_group_id: groupId });
    if (error) Alert.alert('Error', 'Failed to activate group.');
    else {
      Alert.alert('Success', 'Your group is now active for 4 hours!');
      setIsActive(true);
    }
  };

  const deactivateGroup = async () => {
    const { error } = await supabase.rpc('deactivate_group', { p_group_id: groupId });
    if (error) Alert.alert('Error', 'Failed to deactivate group.');
    else {
      Alert.alert('Success', 'Your group is no longer active.');
      setIsActive(false);
    }
  };

  const handleLeaveOrDelete = () => {
    const isOwner = session?.user.id === group.owner_id;
    if (isOwner) {
      Alert.alert('Confirm Delete', 'Are you sure you want to permanently delete this group?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_group', { p_group_id: groupId });
            if (error) Alert.alert('Error', 'Failed to delete group.');
            else {
              Alert.alert('Success', 'Group has been deleted.');
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } else {
      Alert.alert('Confirm Leave', 'Are you sure you want to leave this group?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
            if (error) Alert.alert('Error', 'Failed to leave group.');
            else {
              Alert.alert('Success', 'You have left the group.');
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    }
  };

  if (loading || !group) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isOwner = session?.user.id === group.owner_id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: group.photo_url || 'https://via.placeholder.com/150' }}
          style={styles.profilePhoto}
        />
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.bio}>{group.bio}</Text>
      </View>

      {/* --- ACTION CARD --- */}
      <View style={styles.card}>
        {isActive ? (
          <>
            <View style={styles.activeHeader}>
              <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
              <Text style={styles.activeText}>Your group is active!</Text>
            </View>
            <Pressable
              style={styles.button}
              onPress={() => router.push(`/matching?group_id=${groupId}`)}
            >
              <Text style={styles.buttonText}>Start Swiping</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondaryButton, { marginTop: theme.spacing.s }]}
              onPress={deactivateGroup}
            >
              <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
                Go Inactive
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={activateGroup}>
            <Text style={styles.buttonText}>Go Active for 4 Hours</Text>
          </Pressable>
        )}
      </View>

      {/* --- MEMBERS CARD --- */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members</Text>
          {isOwner && (
            <TouchableOpacity onPress={createInvite} style={styles.inviteButton}>
              <Ionicons name="add" size={16} color={theme.colors.primary} />
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={members}
          keyExtractor={(item) => item.profiles.id}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Image
                source={
                  item.profiles.avatar_url
                    ? { uri: item.profiles.avatar_url }
                    : require('../../assets/placeholder-avatar.png')
                }
                style={styles.memberAvatar}
              />
              <Text style={styles.memberName}>
                {item.profiles.username}
                {item.profiles.id === group.owner_id && (
                  <Text style={styles.adminTag}> (Admin)</Text>
                )}
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* --- MATCHES CARD --- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Matches</Text>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.matchItem}
              onPress={() => router.push(`/chat/${item.match_id}`)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.matchText}>
                Chat with <Text style={styles.matchGroupName}>{item.other_group_name}</Text>
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matches for this group yet.</Text>}
          scrollEnabled={false}
        />
      </View>

      {/* --- LEAVE/DELETE BUTTON --- */}
      <Pressable
        style={[styles.button, styles.destructiveButton]}
        onPress={handleLeaveOrDelete}
      >
        <Text style={[styles.buttonText, { color: theme.colors.error }]}>
          {isOwner ? 'Delete Group' : 'Leave Group'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header Styles
  headerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  bio: {
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.body,
  },
  // Card Styles
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
  },
  // Active State Styles
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  activeText: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.s,
  },
  // Member & Match List Styles
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.m,
    backgroundColor: theme.colors.border,
  },
  memberName: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.text,
  },
  adminTag: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.fontSizes.s,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  matchText: {
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.s,
  },
  matchGroupName: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fonts.body,
  },
  // Button Styles
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  destructiveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
    margin: theme.spacing.m,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.radii.m,
  },
  inviteButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fonts.medium,
    marginLeft: theme.spacing.xs,
  },
});
