import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/SessionProvider';

export default function ChatScreen() {
  const { id: matchId } = useLocalSearchParams();
  const { session } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!matchId) return;

    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages in the channel
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((currentMessages) => [...currentMessages, payload.new]);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchMessages = async () => {
    if (!matchId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('sent_at', { ascending: true });

    if (error) {
      Alert.alert('Error', 'Failed to fetch messages.');
    } else {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user.id) return;

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: session.user.id,
      content: newMessage.trim(),
    });

    if (error) {
      Alert.alert('Error', 'Failed to send message.');
      console.error(error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender_id === session?.user.id ? styles.myMessage : styles.otherMessage,
            ]}>
            <Text style={[
              styles.messageText,
              item.sender_id === session?.user.id ? styles.myMessageText : styles.otherMessageText
            ]}>{item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
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
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
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
