import { View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/SessionProvider';
import { theme } from '../lib/theme';
import { useGroups } from '../providers/GroupsProvider';
import { router } from 'expo-router';

interface Invitation {
  id: string;
  group_name: string;
  inviter_username: string;
}

export default function InvitesScreen() {
  const { session } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchGroups } = useGroups();

  const fetchInvites = async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_invites');

    if (error) {
      Alert.alert('Error', 'Failed to fetch your invitations.');
    } else {
      setInvitations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvites();
  }, [session]);

  const handleResponse = async (invitationId: string, response: 'accepted' | 'declined') => {
    const { data, error } = await supabase.rpc('respond_to_group_invitation', {
      p_invitation_id: invitationId,
      p_response: response,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', data);
      if (response === 'accepted') {
        await fetchGroups(); // Refresh the main group list
        router.replace('/(tabs)');
      }
      // Refresh the invites list
      setInvitations((current) => current.filter((inv) => inv.id !== invitationId));
    }
  };
  
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
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.inviteText}>
              <Text style={styles.username}>{item.inviter_username}</Text> has invited you to join{' '}
              <Text style={styles.groupName}>{item.group_name}</Text>.
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleResponse(item.id, 'accepted')}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.declineButton]}
                onPress={() => handleResponse(item.id, 'declined')}
              >
                <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>Decline</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You have no pending invitations.</Text>
          </View>
        }
        contentContainerStyle={invitations.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fonts.body,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    margin: theme.spacing.m,
    marginBottom: 0,
  },
  inviteText: {
    fontSize: theme.typography.fontSizes.m,
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.body,
    lineHeight: 24,
    marginBottom: theme.spacing.m,
  },
  username: {
    fontFamily: theme.typography.fonts.bold,
  },
  groupName: {
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.radii.m,
    marginLeft: theme.spacing.m,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
});

