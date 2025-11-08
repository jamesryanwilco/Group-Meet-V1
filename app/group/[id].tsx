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
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Slider from '@react-native-community/slider';
import { theme } from '../../lib/theme';
import { useGroups } from '../../providers/GroupsProvider';

export default function GroupDetailsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const { session } = useAuth();
  const navigation = useNavigation();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isActivationModalVisible, setActivationModalVisible] = useState(false);
  const [activationDuration, setActivationDuration] = useState(4); // Default 4 hours, now a number
  const [activationLocation, setActivationLocation] = useState('London'); // Default to London
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteeUsername, setInviteeUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { fetchGroups } = useGroups();
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInviteModalVisible) {
      fetchSuggestions();
    }
  }, [isInviteModalVisible]);

  useEffect(() => {
    if (typeof groupId !== 'string') return;

    navigation.setOptions({
      headerShown: isInviteModalVisible ? false : true,
      headerRight: () => (
        <Pressable onPress={() => router.push(`/group/edit/${groupId}`)}>
          <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation, groupId, isInviteModalVisible]);

  useEffect(() => {
    if (group?.name) {
      navigation.setOptions({
        title: group.name,
      });
    }
  }, [navigation, group]);

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

    const activeUntil = groupData.active_until ? new Date(groupData.active_until) : null;
    setIsActive(activeUntil ? activeUntil > new Date() : false);

    const { data: membersData, error: membersError } = await supabase
      .from('group_members')
      .select('profiles(id, username, avatar_url)')
      .eq('group_id', groupId);
    if (membersError) Alert.alert('Error', 'Failed to fetch group members.');
    else setMembers(membersData.filter((m) => m.profiles));

    const { data: photosData, error: photosError } = await supabase
      .from('group_photos')
      .select('id, photo_url')
      .eq('group_id', groupId);

    if (photosError) {
      Alert.alert('Error', 'Failed to fetch group photos.');
    } else {
      setGalleryPhotos(photosData);
    }

    const { data: matchesData, error: matchesError } = await supabase
      .from('match_details')
      .select('*')
      .or(`group_1.eq.${groupId},group_2.eq.${groupId}`);
    if (matchesError) Alert.alert('Error', 'Failed to fetch group matches.');
    else {
      const formattedMatches = matchesData.map((match) => ({
        ...match,
        other_group_name: match.group_1 === groupId ? match.group_2_name : match.group_1_name,
        other_group_photo: match.group_1 === groupId ? match.group_2_photo : match.group_1_photo,
        other_group_id: match.group_1 === groupId ? match.group_2 : match.group_1,
      }));
      setMatches(formattedMatches);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const handleSendInvite = async () => {
    if (!inviteeUsername.trim()) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }
    const { data, error } = await supabase.rpc('invite_user_to_group', {
      p_group_id: groupId,
      p_invitee_username: inviteeUsername.trim(),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', data);
      setInviteeUsername('');
      setSearchResults([]);
      setInviteModalVisible(false);
    }
  };

  const fetchSuggestions = async () => {
    if (typeof groupId !== 'string') return;
    setIsSearching(true);
    const { data, error } = await supabase.rpc('search_profiles', {
      p_search_term: '',
      p_group_id: groupId,
    });
    if (!error) {
      setSearchResults(data);
    }
    setIsSearching(false);
  };

  const handleUsernameChange = (text: string) => {
    setInviteeUsername(text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (text.length > 0) {
      setIsSearching(true);
      debounceTimeout.current = setTimeout(async () => {
        const { data, error } = await supabase.rpc('search_profiles', {
          p_search_term: text,
          p_group_id: groupId,
        });
        if (!error) {
          setSearchResults(data);
        }
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      fetchSuggestions();
    }
  };

  const handleInvite = async (username: string) => {
    setInviteeUsername(username);
    await handleSendInvite();
  };

  const handleActivate = async () => {
    const { error } = await supabase.rpc('activate_group', {
      p_group_id: groupId,
      p_duration_hours: activationDuration,
      p_location: activationLocation,
    });

    if (error) {
      Alert.alert('Error', 'Failed to activate group.');
      console.error(error);
    } else {
      Alert.alert('Success', `Your group is now active for ${activationDuration} hours!`);
      // Manually update the client-side state to reflect the change immediately
      const newActiveUntil = new Date();
      newActiveUntil.setHours(newActiveUntil.getHours() + activationDuration);
      setGroup({ ...group, active_until: newActiveUntil.toISOString() });
      setIsActive(true);
      setActivationModalVisible(false);
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

  const handleLeaveGroup = () => {
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
            await fetchGroups();
            router.replace('/(tabs)');
          }
        },
      },
    ]);
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
        {galleryPhotos.length > 1 && (
          <FlatList
            data={galleryPhotos.filter((p) => p.photo_url !== group.photo_url)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryContainer}
            renderItem={({ item }) => (
              <Image source={{ uri: item.photo_url }} style={styles.galleryPhoto} />
            )}
            ListEmptyComponent={
              galleryPhotos.length > 0 && group.photo_url ? null : <View /> // Render nothing if main photo is the only one
            }
          />
        )}
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
          <>
            <Pressable
              style={[styles.button, members.length < 2 && styles.disabledButton]}
              onPress={() => setActivationModalVisible(true)}
              disabled={members.length < 2}
            >
              <Text style={[styles.buttonText, members.length < 2 && styles.disabledButtonText]}>
                Go Active
              </Text>
            </Pressable>
            {members.length < 2 && (
              <Text style={styles.disabledReasonText}>
                You need at least 2 members to go active.
              </Text>
            )}
          </>
        )}
      </View>

      {/* --- ACTIVATION MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isActivationModalVisible}
        onRequestClose={() => setActivationModalVisible(false)}
      >
        <SafeAreaView style={styles.activationModalContainer}>
          <View style={styles.activationModalHeader}>
            <Pressable onPress={() => setActivationModalVisible(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Set Your Group's Status</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.activationModalContent}>
            <View style={styles.sliderContainer}>
              <Text style={styles.modalLabel}>How many hours?</Text>
              <Text style={styles.sliderValueText}>{activationDuration} hours</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={24}
                step={1}
                value={activationDuration}
                onValueChange={setActivationDuration}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>

            <View>
              <Text style={styles.modalLabel}>Where are you meeting?</Text>
              <View style={styles.locationPicker}>
                <Text style={styles.locationText}>{activationLocation}</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.button} onPress={handleActivate}>
                <Text style={styles.buttonText}>Confirm & Go Active</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* --- MATCHES CARD --- */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matches ({matches.length})</Text>
        </View>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() =>
                router.push(`/matched-group/${item.other_group_id}?match_id=${item.match_id}`)
              }
            >
              <Image
                source={
                  item.other_group_photo
                    ? { uri: item.other_group_photo }
                    : require('../../assets/group-placeholders/P1.png')
                }
                style={styles.matchAvatar}
              />
              <View style={styles.matchContent}>
                <Text style={styles.matchGroupName} numberOfLines={1}>
                  {item.other_group_name}
                </Text>
                <View style={styles.chatPrompt}>
                  <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.chatPromptText}>View Group</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No matches for this group yet.</Text>}
          scrollEnabled={false}
        />
      </View>

      {/* --- MEMBERS CARD --- */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {isOwner && (
            <TouchableOpacity onPress={() => setInviteModalVisible(true)} style={styles.inviteButton}>
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

      {/* --- INVITE MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isInviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Search"
                placeholderTextColor={theme.colors.placeholder}
                value={inviteeUsername}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                keyboardAppearance="dark"
                autoFocus
              />
            </View>
            <Pressable onPress={() => setInviteModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </Pressable>
          </View>

          {isSearching && <ActivityIndicator style={{ marginTop: theme.spacing.xl }} />}

          {searchResults.length > 0 && (
            <>
              <Text style={styles.listHeader}>
                {inviteeUsername.length > 0 ? 'Search Results' : 'Suggestions'}
              </Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                style={styles.searchResultsContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => {
                      handleInvite(item.username);
                    }}
                  >
                    <Image
                      source={
                        item.avatar_url
                          ? { uri: item.avatar_url }
                          : require('../../assets/placeholder-avatar.png')
                      }
                      style={styles.searchResultAvatar}
                    />
                    <View>
                      <Text style={styles.searchResultUsername}>{item.username}</Text>
                      <Text style={styles.searchResultSubtitle}>User</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* --- LEAVE/DELETE BUTTON --- */}
      {!isOwner && (
        <Pressable
          style={[styles.button, styles.destructiveButton]}
          onPress={handleLeaveGroup}
        >
          <Text style={[styles.buttonText, { color: theme.colors.error }]}>
            Leave Group
          </Text>
        </Pressable>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.l, // Changed from 50 to create a rounded square
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  galleryContainer: {
    paddingLeft: theme.spacing.m,
  },
  galleryPhoto: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.m,
    marginRight: theme.spacing.s,
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
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.m,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  matchInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.m,
    marginRight: theme.spacing.m,
  },
  matchContent: {
    flex: 1,
    justifyContent: 'center',
  },
  matchGroupName: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text,
  },
  chatPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  chatPromptText: {
    fontSize: theme.typography.fontSizes.s,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
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
  disabledButton: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  disabledButtonText: {
    color: theme.colors.textSecondary,
  },
  disabledReasonText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.fontSizes.s,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Activation Modal Styles
  activationModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  activationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
  },
  activationModalContent: {
    flex: 1,
    padding: theme.spacing.m,
    justifyContent: 'space-between',
  },
  sliderContainer: {
    alignItems: 'stretch',
  },
  modalLabel: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  sliderValueText: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  locationPicker: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.l,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  locationText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.medium,
  },
  modalFooter: {
    paddingBottom: theme.spacing.l,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.m,
    paddingHorizontal: theme.spacing.m,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingVertical: theme.spacing.s,
    paddingLeft: theme.spacing.s,
    fontSize: theme.typography.fontSizes.m,
  },
  cancelButton: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
    marginLeft: theme.spacing.m,
  },
  listHeader: {
    fontFamily: theme.typography.fonts.heading,
    fontSize: theme.typography.fontSizes.l,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.m,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  searchResultsContainer: {
    paddingHorizontal: theme.spacing.m,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
  },
  searchResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: theme.spacing.m,
  },
  searchResultUsername: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.medium,
  },
  searchResultSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.s,
  },
});
