import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Alert, View, Button, Image, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../providers/SessionProvider';

interface Props {
  onUpload: (url: string) => void;
  currentAvatarUrl: string | null;
}

export default function AvatarUploader({ onUpload, currentAvatarUrl }: Props) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    if (!session?.user) return;

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
    const filePath = `${session.user.id}/${new Date().getTime()}.${fileExt}`;
    const { uri } = asset;

    const formData = new FormData();
    formData.append('file', { uri, name: `photo.${fileExt}`, type: `image/${fileExt}` } as any);

    setUploading(true);

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('user-profile-photos')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-profile-photos')
        .getPublicUrl(data.path);

      onUpload(publicUrl);

    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          currentAvatarUrl
            ? { uri: currentAvatarUrl }
            : require('../../assets/placeholder-avatar.png')
        }
        style={styles.avatar}
      />
      <Button
        title={uploading ? 'Uploading...' : 'Change Avatar'}
        onPress={pickAndUploadImage}
        disabled={uploading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ccc',
  },
});
