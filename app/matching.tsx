import { View, Text, StyleSheet, Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const placeholderPhotos = [
  require('../assets/group-placeholders/P1.png'),
  require('../assets/group-placeholders/P2.png'),
  require('../assets/group-placeholders/P3.png'),
  require('../assets/group-placeholders/P4.png'),
  require('../assets/group-placeholders/P5.png'),
];

const placeholderGroups = [
  {
    id: 'p1',
    name: 'Weekend Wanderers',
    bio: 'Exploring the city, one brunch at a time.',
    photos: placeholderPhotos,
    isPlaceholder: true,
  },
  {
    id: 'p2',
    name: 'The Foodie Crew',
    bio: 'In search of the best eats and hidden gems.',
    photos: placeholderPhotos.slice().reverse(), // Mix it up
    isPlaceholder: true,
  },
  {
    id: 'p3',
    name: 'Trail Blazers',
    bio: 'Hiking, camping, and everything outdoors.',
    photos: placeholderPhotos,
    isPlaceholder: true,
  },
  {
    id: 'p4',
    name: 'Game Night Pros',
    bio: 'Board games, video games, you name it.',
    photos: placeholderPhotos.slice().reverse(),
    isPlaceholder: true,
  },
  {
    id: 'p5',
    name: 'Concert Goers',
    bio: 'Live music enthusiasts hitting all the shows.',
    photos: placeholderPhotos,
    isPlaceholder: true,
  },
];

export default function MatchingScreen() {
  const { group_id: swipingGroupId } = useLocalSearchParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reset image index whenever the group card changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentGroupIndex]);

  useEffect(() => {
    if (typeof swipingGroupId !== 'string') {
      Alert.alert('Error', 'No group selected for swiping.');
      router.back();
      return;
    }
    fetchActiveGroups(swipingGroupId);
  }, [swipingGroupId]);

  const fetchActiveGroups = async (myGroupId: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_groups_for_swiping', {
      p_swiping_group_id: myGroupId,
    });
    if (error) {
      Alert.alert('Error', 'Failed to fetch active groups.');
      setGroups(placeholderGroups);
    } else {
      // For real groups, convert the single photo_url into a photos array
      const realGroups = data.map((group: any) => ({
        ...group,
        photos: group.photo_url ? [group.photo_url] : [],
      }));
      setGroups([...realGroups, ...placeholderGroups]);
    }
    setLoading(false);
  };

  const handleNextImage = () => {
    const currentGroup = groups[currentGroupIndex];
    if (currentImageIndex < currentGroup.photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (typeof swipingGroupId !== 'string' || currentGroupIndex >= groups.length) return;
    const swipedGroup = groups[currentGroupIndex];
    if (swipedGroup.isPlaceholder) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      return;
    }
    const { error } = await supabase.from('swipes').insert({
      swiper_group_id: swipingGroupId,
      swiped_group_id: swipedGroup.id,
      liked: liked,
    });
    if (error) {
      Alert.alert('Error', 'Could not record your swipe.');
    } else {
      if (liked) {
        const didMatch = await checkForMatch(swipedGroup.id);
        if (didMatch) return;
      }
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const checkForMatch = async (swipedGroupId: string): Promise<boolean> => {
    if (typeof swipingGroupId !== 'string') return false;
    const { data, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_group_id', swipedGroupId)
      .eq('swiped_group_id', swipingGroupId)
      .eq('liked', true)
      .single();
    if (data && !error) {
      const { data: matchData, error: matchError } = await supabase.rpc('create_new_match', {
        group_1_id: swipingGroupId,
        group_2_id: swipedGroupId,
      });
      if (matchError) {
        if (matchError.code === '23505') {
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .or(
              `and(group_1.eq.${swipingGroupId},group_2.eq.${swipedGroupId}),and(group_1.eq.${swipedGroupId},group_2.eq.${swipingGroupId})`
            )
            .single();
          if (existingMatch) {
            router.push(`/chat/${existingMatch.id}`);
            return true;
          }
        } else {
          Alert.alert('Error', 'Failed to create a match record.');
        }
      } else if (matchData) {
        Alert.alert("It's a Match!", 'You and the other group have liked each other.');
        router.push(`/chat/${matchData}`);
        return true;
      }
    }
    return false;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (currentGroupIndex >= groups.length) {
    return (
      <View style={styles.container}>
        <Ionicons name="people-circle-outline" size={80} color={theme.colors.placeholder} />
        <Text style={styles.title}>No More Groups</Text>
        <Text style={styles.subtitle}>You've seen all the active groups. Check back later!</Text>
      </View>
    );
  }

  const currentGroup = groups[currentGroupIndex];
  const imageUris = currentGroup.photos || [];
  const currentImageUri = imageUris[currentImageIndex];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {currentImageUri && (
          <Image
            source={currentGroup.isPlaceholder ? currentImageUri : { uri: currentImageUri }}
            style={styles.photo}
          />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
          <Text style={styles.groupName}>{currentGroup.name}</Text>
          <Text style={styles.bio}>{currentGroup.bio}</Text>
        </LinearGradient>

        {/* --- Image Navigation --- */}
        <View style={styles.navOverlay}>
          <Pressable style={styles.navButton} onPress={handlePrevImage} />
          <Pressable style={styles.navButton} onPress={handleNextImage} />
        </View>

        {/* --- Progress Indicators --- */}
        {imageUris.length > 1 && (
          <View style={styles.indicatorContainer}>
            {imageUris.map((_, index) => (
              <View
                key={index}
                style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Pressable style={[styles.swipeButton, styles.passButton]} onPress={() => handleSwipe(false)}>
          <Ionicons name="close" size={40} color={theme.colors.error} />
        </Pressable>
        <Pressable style={[styles.swipeButton, styles.likeButton]} onPress={() => handleSwipe(true)}>
          <Ionicons name="heart" size={40} color={theme.colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    justifyContent: 'flex-end',
    borderRadius: theme.radii.l,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: theme.spacing.m,
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: theme.spacing.s,
    left: theme.spacing.s,
    right: theme.spacing.s,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  groupName: {
    fontSize: theme.typography.fontSizes.l,
    fontFamily: theme.typography.fonts.heading,
    color: 'white',
  },
  bio: {
    fontSize: theme.typography.fontSizes.m,
    fontFamily: theme.typography.fonts.body,
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '80%',
    marginTop: theme.spacing.l,
  },
  swipeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  passButton: {},
  likeButton: {},
});
