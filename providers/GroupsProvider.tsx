import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SessionProvider';

interface Group {
  id: string;
  name: string;
  photo_url: string;
  bio: string;
  member_count: number;
  member_avatars: (string | null)[];
}

interface GroupsContextType {
  groups: Group[];
  loading: boolean;
  fetchGroups: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export const GroupsProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_groups_with_member_details');

    if (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } else {
      setGroups(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchGroups();
    } else {
      // If user logs out, clear the groups and set loading to false
      setGroups([]);
      setLoading(false);
    }
  }, [session]);

  const value = {
    groups,
    loading,
    fetchGroups,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupsProvider');
  }
  return context;
};
