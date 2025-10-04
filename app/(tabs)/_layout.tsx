import { Tabs } from 'expo-router';
import { Button } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerRight: () => <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />,
        }}
      />
    </Tabs>
  );
}
