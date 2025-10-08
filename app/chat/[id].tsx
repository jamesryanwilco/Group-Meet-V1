import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/SessionProvider';

export default function ChatScreen() {
  const { id: matchId } = useLocalSearchParams();
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const messagesPerPage = 20;

  useEffect(() => {
    if (!matchId) return;

    // Fetch initial messages (page 0)
    fetchMessages(0);

    // Subscribe to new messages in the channel
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          // When a new message arrives, fetch its details including the sender's profile
          const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Failed to fetch new message details:', error);
          } else if (data) {
            // If the message is from someone else, just add it.
            if (data.sender_id !== session?.user.id) {
              setMessages((currentMessages) => [data, ...currentMessages]);
              return;
            }
            
            // If the message is from the current user, replace the optimistic message.
            setMessages((currentMessages) => {
              const optimisticIndex = currentMessages.findIndex(
                (m) => typeof m.id === 'number' // Optimistic messages have a temporary, non-integer ID
              );
              if (optimisticIndex !== -1) {
                const newMessages = [...currentMessages];
                newMessages[optimisticIndex] = data;
                return newMessages;
              } else {
                // Fallback in case the optimistic message isn't found
                return [data, ...currentMessages];
              }
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
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
      .order('sent_at', { ascending: false }) // Fetch newest first
      .range(from, to);

    if (error) {
      Alert.alert('Error', 'Failed to fetch messages.');
    } else {
      if (data.length < messagesPerPage) {
        setAllMessagesLoaded(true);
      }
      // Prepend older messages
      setMessages((currentMessages) => page === 0 ? data : [...currentMessages, ...data]);
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
      id: Math.random(), // Temporary unique ID
      content: newMessage.trim(),
      sender_id: session.user.id,
      sent_at: new Date().toISOString(),
      profiles: {
        username: 'You', // This will be quickly replaced by the real-time update
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
      // Optional: remove the optimistic message on failure
      setMessages((currentMessages) => currentMessages.filter(m => m.id !== optimisticMessage.id));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ margin: 10 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => {
          const isMyMessage = item.sender_id === session?.user.id;
          return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
              {!isMyMessage && (
                <Image
                  source={item.profiles?.avatar_url ? { uri: item.profiles.avatar_url } : require('../../assets/placeholder-avatar.png')}
                  style={styles.avatar}
                />
              )}
              <View
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessage : styles.otherMessage,
                ]}>
                {!isMyMessage && (
                  <Text style={styles.senderName}>
                    {item.profiles?.username || 'Unknown User'}
                  </Text>
                )}
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText
                ]}>{item.content}</Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
        inverted // This is the key for chat UIs
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
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
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
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '80%',
  },
  senderName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
});
