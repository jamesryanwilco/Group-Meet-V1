import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SessionProvider';

interface Group {
  id: string;
  name: string;
  photo_url: string;
  bio: string;
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
    const { data, error } = await supabase
      .from('group_members')
      .select('groups(id, name, photo_url, bio)')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } else {
      const fetchedGroups = data?.map((item: any) => item.groups).filter(Boolean) || [];
      setGroups(fetchedGroups);
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
