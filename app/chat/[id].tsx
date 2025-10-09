import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/SessionProvider';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { id: matchId } = useLocalSearchParams();
  const { session } = useAuth();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const messagesPerPage = 20;

  useLayoutEffect(() => {
    if (!matchId || typeof matchId !== 'string') return;

    const fetchMatchDetails = async () => {
      const { data: userGroupsData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id);

      if (!userGroupsData) return;
      const myGroupIds = userGroupsData.map((ug) => ug.group_id);

      const { data, error } = await supabase
        .from('match_details')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (data) {
        const otherGroupName = myGroupIds.includes(data.group_1)
          ? data.group_2_name
          : data.group_1_name;
        navigation.setOptions({ title: `Chat with ${otherGroupName}` });
      }
    };

    fetchMatchDetails();
  }, [matchId, navigation]);

  useEffect(() => {
    if (!matchId) return;
    fetchMessages(0);
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Failed to fetch new message details:', error);
          } else if (data) {
            if (data.sender_id !== session?.user.id) {
              setMessages((currentMessages) => [data, ...currentMessages]);
              return;
            }
            setMessages((currentMessages) => {
              const optimisticIndex = currentMessages.findIndex((m) => typeof m.id === 'number');
              if (optimisticIndex !== -1) {
                const newMessages = [...currentMessages];
                newMessages[optimisticIndex] = data;
                return newMessages;
              } else {
                return [data, ...currentMessages];
              }
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchMessages = async (page: number) => {
    if (!matchId || allMessagesLoaded) {
      return;
    }

    const from = page * messagesPerPage;
    const to = from + messagesPerPage - 1;

    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username, avatar_url)')
      .eq('match_id', matchId)
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (error) {
      Alert.alert('Error', 'Failed to fetch messages.');
    } else {
      if (data.length < messagesPerPage) {
        setAllMessagesLoaded(true);
      }
      setMessages((currentMessages) => (page === 0 ? data : [...currentMessages, ...data]));
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMoreMessages = () => {
    if (loadingMore || allMessagesLoaded) return;
    setLoadingMore(true);
    const currentPage = Math.floor(messages.length / messagesPerPage);
    fetchMessages(currentPage + 1);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user.id) return;

    const optimisticMessage = {
      id: Math.random(),
      content: newMessage.trim(),
      sender_id: session.user.id,
      sent_at: new Date().toISOString(),
      profiles: {
        username: 'You',
        avatar_url: null,
      },
    };

    setMessages((currentMessages) => [optimisticMessage, ...currentMessages]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: session.user.id,
      content: newMessage.trim(),
    });

    if (error) {
      Alert.alert('Error', 'Failed to send message.');
      console.error(error);
      setMessages((currentMessages) =>
        currentMessages.filter((m) => m.id !== optimisticMessage.id)
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={({ item }) => {
          const isMyMessage = item.sender_id === session?.user.id;
          return (
            <View
              style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
              ]}
            >
              {!isMyMessage && (
                <Image
                  source={
                    item.profiles?.avatar_url
                      ? { uri: item.profiles.avatar_url }
                      : require('../../assets/placeholder-avatar.png')
                  }
                  style={styles.avatar}
                />
              )}
              <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                {!isMyMessage && (
                  <Text style={styles.senderName}>{item.profiles?.username || 'Unknown'}</Text>
                )}
                <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
        inverted
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 10 }} /> : null}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.placeholder}
          keyboardAppearance="dark"
        />
        <Pressable
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color={theme.colors.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    padding: theme.spacing.m,
  },
  // Message Styles
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.m,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: theme.spacing.s,
  },
  messageBubble: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: 20,
    maxWidth: '80%',
  },
  senderName: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.link,
    fontFamily: theme.typography.fonts.medium,
    marginBottom: theme.spacing.xs,
  },
  myMessage: {
    backgroundColor: theme.colors.primaryDark,
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 5,
  },
  myMessageText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
  },
  otherMessageText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
  },
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginRight: theme.spacing.m,
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.m,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.placeholder,
  },
});
