import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import ImageUploader from '../../components/ImageUploader';
import { theme } from '../../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

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
            if (photoUrl === photoUrlToDelete) {
              setPhotoUrl('');
            }
            fetchGroupAndPhotos();
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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* --- DETAILS CARD --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Group Name"
          placeholderTextColor={theme.colors.placeholder}
        />

        <Text style={styles.label}>Group Bio</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Group Bio"
          placeholderTextColor={theme.colors.placeholder}
          multiline
        />
      </View>

      {/* --- GALLERY CARD --- */}
      <View style={styles.card}>
        <Text style={styles.label}>Group Profile Photo</Text>
        <Text style={styles.subLabel}>Tap a photo from the gallery to select it as the profile photo.</Text>
        <Image
          source={{ uri: photoUrl || 'https://via.placeholder.com/150' }}
          style={styles.profilePhoto}
        />
        <FlatList
          horizontal
          data={galleryPhotos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.photoContainer}>
              <TouchableOpacity onPress={() => setPhotoUrl(item.photo_url)}>
                <Image
                  source={{ uri: item.photo_url }}
                  style={[
                    styles.galleryPhoto,
                    photoUrl === item.photo_url && styles.selectedPhoto,
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deletePhoto(item.photo_url)}>
                <Ionicons name="close-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos in gallery.</Text>}
          style={{ marginBottom: theme.spacing.m }}
        />

        <ImageUploader
          groupId={groupId as string}
          groupPhotoUrl={photoUrl}
          onUpload={fetchGroupAndPhotos}
        />
      </View>

      <Pressable style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.l,
    padding: theme.spacing.m,
    margin: theme.spacing.m,
  },
  label: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  subLabel: {
    fontSize: theme.typography.fontSizes.s,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.m,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.typography.fontSizes.m,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: theme.spacing.l,
    backgroundColor: theme.colors.border,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  photoContainer: {
    marginRight: theme.spacing.s,
  },
  galleryPhoto: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.m,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPhoto: {
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: theme.spacing.m,
    fontFamily: theme.typography.fonts.body,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
    margin: theme.spacing.m,
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
});
