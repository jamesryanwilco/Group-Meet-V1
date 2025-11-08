import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';
import { useAuth } from '../../providers/SessionProvider';
import { Ionicons } from '@expo/vector-icons';

export default function MatchedGroupScreen() {
  const { id: groupId, match_id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { session } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canUnmatch, setCanUnmatch] = useState(false);

  const handleDeleteMatch = async () => {
    if (typeof match_id !== 'string') return;
    Alert.alert(
      'Confirm Unmatch',
      'Are you sure you want to unmatch this group? This will delete the chat history for both groups and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_match', { p_match_id: match_id });
            if (error) {
              Alert.alert('Error', 'Failed to unmatch group.');
              console.error(error);
            } else {
              Alert.alert('Success', 'Group unmatched.');
              router.back();
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (group?.name) {
      navigation.setOptions({
        title: group.name,
        headerRight: () =>
          canUnmatch ? (
            <Pressable onPress={handleDeleteMatch}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </Pressable>
          ) : null,
      });
    }
  }, [navigation, group, canUnmatch]);

  const fetchGroupDetails = async () => {
    if (typeof groupId !== 'string' || typeof match_id !== 'string') {
      Alert.alert('Error', 'Invalid Group ID.');
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

    // Check if the current user is an owner of their group in this match
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('group_1, group_2')
      .eq('id', match_id)
      .single();

    if (matchData && !matchError) {
      const myGroupId = matchData.group_1 === groupId ? matchData.group_2 : matchData.group_1;
      const { data: myGroupData, error: myGroupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', myGroupId)
        .single();

      if (myGroupData && !myGroupError) {
        if (myGroupData.owner_id === session?.user.id) {
          setCanUnmatch(true);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId, match_id]);

  if (loading || !group) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
          />
        )}
      </View>

      {/* --- MEMBERS CARD --- */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
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

      {/* --- CHAT BUTTON CARD --- */}
      <View style={styles.card}>
        <Pressable
          style={styles.button}
          onPress={() => router.push(`/chat/${match_id}`)}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.text} />
          <Text style={styles.buttonText}>Open Chat</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.l,
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
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
});
