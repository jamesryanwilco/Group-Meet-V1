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
} from 'react-native';
import { useAuth } from '../../providers/SessionProvider';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserGroups = async () => {
    if (!session?.user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('group_members')
      .select('groups(id, name, photo_url, bio)')
      .eq('user_id', session.user.id);

    if (error) {
      Alert.alert('Error', 'Failed to fetch your groups.');
      console.error(error);
    } else {
      setGroups(data.map((item) => item.groups));
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserGroups();
    }, [session])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
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
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={theme.colors.placeholder} />
            <Text style={styles.emptyText}>You're not in any groups yet.</Text>
            <Text style={styles.emptySubText}>Create or join one to get started!</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => router.push('/create-group')}>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.text} />
          <Text style={styles.buttonText}>Create a New Group</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/join-group')}
        >
          <Ionicons name="enter-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Join a Group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
});
