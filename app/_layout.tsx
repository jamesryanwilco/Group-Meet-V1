import { Stack, router, useSegments } from 'expo-router';
import { SessionProvider, useAuth } from '../providers/SessionProvider';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { theme } from '../lib/theme';
import { GroupsProvider } from '../providers/GroupsProvider';

const AppLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.heading,
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/sign-up" options={{ headerShown: false }} />
      <Stack.Screen
        name="join-group"
        options={{ presentation: 'modal', title: 'Join a Group' }}
      />
      <Stack.Screen
        name="create-group"
        options={{ presentation: 'modal', title: 'Create a Group' }}
      />
      <Stack.Screen
        name="group/[id]"
        options={{
          title: 'Group Details',
        }}
      />
      <Stack.Screen
        name="group/edit/[id]"
        options={{ presentation: 'modal', title: 'Edit Group' }}
      />
      <Stack.Screen name="profile/edit" options={{ presentation: 'modal', title: 'Edit Profile' }} />
      <Stack.Screen name="matching" options={{ title: 'Find a Match' }} />
    </Stack>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SessionProvider>
      <GroupsProvider>
        <AppLayout />
      </GroupsProvider>
    </SessionProvider>
  );
}
