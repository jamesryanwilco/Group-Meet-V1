import { View, Text, TextInput, Button, Alert, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import ImageUploader from '../../components/ImageUploader';

export default function EditGroupScreen() {
  const { id: groupId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupAndPhotos = async () => {
    if (typeof groupId !== 'string') return;
    setLoading(true);

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

  useEffect(() => {
    fetchGroupAndPhotos();
  }, [groupId]);

  const deletePhoto = async (photoUrlToDelete: string) => {
    const filePath = photoUrlToDelete.split('/group-photos/').pop();
    if (!filePath) return;

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.storage.from('group-photos').remove([filePath]);
            await supabase.from('group_photos').delete().eq('photo_url', photoUrlToDelete);
            
            // If the deleted photo was the profile photo, clear it
            if (photoUrl === photoUrlToDelete) {
              setPhotoUrl('');
            }
            fetchGroupAndPhotos(); // Refresh the gallery
          } catch (error) {
            Alert.alert('Error', 'Failed to delete photo.');
          }
        },
      },
    ]);
  };

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

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Group</Text>

      <Text style={styles.label}>Profile Photo</Text>
      <Image source={{ uri: photoUrl || 'https://via.placeholder.com/150' }} style={styles.profilePhoto} />

      <Text style={styles.label}>Photo Gallery</Text>
      <FlatList
        horizontal
        data={galleryPhotos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={() => setPhotoUrl(item.photo_url)}>
              <Image
                source={{ uri: item.photo_url }}
                style={[styles.galleryPhoto, photoUrl === item.photo_url && styles.selectedPhoto]}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item.photo_url)}>
              <Text style={styles.deleteButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Upload photos to get started.</Text>}
      />
      
      <ImageUploader groupId={groupId as string} groupPhotoUrl={photoUrl} onUpload={fetchGroupAndPhotos} />


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
  photoContainer: {
    marginRight: 10,
  },
  galleryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPhoto: {
    borderColor: '#007AFF',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
