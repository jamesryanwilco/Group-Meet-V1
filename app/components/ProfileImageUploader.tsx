import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Alert, View, Button } from 'react-native';
import { useState } from 'react';

interface Props {
  onUpload: (url: string) => void;
}

export default function ProfileImageUploader({ onUpload }: Props) {
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      quality: 0.5,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const fileExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const filePath = `public/${new Date().getTime()}.${fileExt}`;
    const { uri } = asset;

    const formData = new FormData();
    formData.append('file', { uri, name: `photo.${fileExt}`, type: `image/${fileExt}` } as any);

    setUploading(true);

    try {
      // For simplicity, we'll upload profile photos to a public folder in the 'group-photos' bucket
      const { data, error: uploadError } = await supabase.storage
        .from('group-photos')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-photos')
        .getPublicUrl(data.path);

      onUpload(publicUrl); // Pass the URL back to the parent component

    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Button
        title={uploading ? 'Uploading...' : 'Change Profile Photo'}
        onPress={pickAndUploadImage}
        disabled={uploading}
      />
    </View>
  );
}
