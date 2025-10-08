import { View, Text, TextInput, Button, Alert, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function EditGroupScreen() {
  const { id: groupId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof groupId !== 'string') return;
    
    const fetchGroupAndPhotos = async () => {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('name, bio, photo_url')
        .eq('id', groupId)
        .single();
      
      if (groupError) {
        Alert.alert('Error', 'Failed to fetch group details.');
        setLoading(false);
        return;
      }
      
      setName(groupData.name);
      setBio(groupData.bio || '');
      setPhotoUrl(groupData.photo_url || '');

      // Fetch gallery photos
      const { data: photosData, error: photosError } = await supabase
        .from('group_photos')
        .select('id, photo_url')
        .eq('group_id', groupId);

      if (photosError) {
        Alert.alert('Error', 'Failed to fetch group photos.');
      } else {
        setGalleryPhotos(photosData);
      }
      setLoading(false);
    };
    fetchGroupAndPhotos();
  }, [groupId]);

  const handleUpdate = async () => {
    if (typeof groupId !== 'string') return;

    const { error } = await supabase.rpc('update_group_details', {
      p_group_id: groupId,
      p_name: name,
      p_bio: bio,
      p_photo_url: photoUrl,
    });

    if (error) {
      Alert.alert('Error', 'Failed to update group.');
    } else {
      Alert.alert('Success', 'Group updated successfully.');
      router.back();
    }
  };

  // This will be a temporary uploader for the main photo.
  // We'll upload a photo and just save its URL to state.
  const uploadGroupPhoto = async () => {
    // A simplified uploader logic just for the main photo
    // This is a placeholder for a more robust component if needed
    Alert.alert("Upload Photo", "This will be the group's main profile picture.");
  };

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Group</Text>

      <Text style={styles.label}>Select Profile Photo</Text>
      <Image source={{ uri: photoUrl || 'https://via.placeholder.com/150' }} style={styles.profilePhoto} />

      <FlatList
        horizontal
        data={galleryPhotos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setPhotoUrl(item.photo_url)}>
            <Image
              source={{ uri: item.photo_url }}
              style={[styles.galleryPhoto, photoUrl === item.photo_url && styles.selectedPhoto]}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Upload photos on the group details page first.</Text>}
      />

      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Group Name"
      />

      <Text style={styles.label}>Group Bio</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        placeholder="Group Bio"
        multiline
      />

      <Button title="Save Changes" onPress={handleUpdate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  galleryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPhoto: {
    borderColor: '#007AFF',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    padding: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
