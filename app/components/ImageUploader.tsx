import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Alert, View, Button } from 'react-native';
import { useState } from 'react';

interface Props {
  groupId: string;
  groupPhotoUrl: string | null; // Pass the current group photo URL
  onUpload: () => void;
}

export default function ImageUploader({ groupId, groupPhotoUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    // 1. Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
      return;
    }

    // 2. Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images', // Corrected: Use the new MediaType enum
      allowsEditing: true,
      quality: 0.5,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return; // User cancelled the picker
    }

    const asset = result.assets[0];
    const fileExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const filePath = `${groupId}/${new Date().getTime()}.${fileExt}`;
    const { uri } = asset;

    // Create a FormData object
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `photo.${fileExt}`,
      type: `image/${fileExt}`,
    } as any);

    setUploading(true);

    try {
      // 3. Upload the image using FormData
      const { data, error: uploadError } = await supabase.storage
        .from('group-photos')
        .upload(filePath, formData);

      if (uploadError) {
        throw uploadError;
      }

      // 4. Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('group-photos')
        .getPublicUrl(data.path);

      // 5. Insert a record into our group_photos table
      const { error: insertError } = await supabase.from('group_photos').insert({
        group_id: groupId,
        photo_url: publicUrl,
      });

      if (insertError) {
        throw insertError;
      }

      // 6. If the group doesn't have a profile photo yet, set this one as the default.
      if (!groupPhotoUrl) {
        const { error: updateError } = await supabase.rpc('update_group_details', {
          p_group_id: groupId,
          p_name: null, // We're only updating the photo, so other fields can be null
          p_bio: null,
          p_photo_url: publicUrl,
        });

        if (updateError) {
          // This is not a critical error, so we can just log it
          console.error('Failed to set default profile photo:', updateError);
        }
      }

      // 7. Call the onUpload callback to trigger a refresh
      onUpload();

    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Button
        title={uploading ? 'Uploading...' : 'Upload a Photo'}
        onPress={pickAndUploadImage}
        disabled={uploading}
      />
    </View>
  );
}
