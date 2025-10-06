import React from 'react';
import { useSession } from '../hooks/useSession';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';

const SessionContext = React.createContext<{ session: any; loading: boolean } | null>(null);

export function useAuth() {
  const value = React.useContext(SessionContext);
  if (!value) {
    throw new Error('useAuth must be wrapped in a <SessionProvider />');
  }
  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const { session, loading } = useSession();

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
      }}>
      {props.children}
    </SessionContext.Provider>
  );
}
