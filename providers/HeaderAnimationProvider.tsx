import React, { createContext, useContext } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';

type HeaderAnimationContextType = {
  scrollY: Animated.SharedValue<number>;
};

const HeaderAnimationContext = createContext<HeaderAnimationContextType | null>(null);

export const HeaderAnimationProvider = ({ children }: { children: React.ReactNode }) => {
  const scrollY = useSharedValue(0);

  return (
    <HeaderAnimationContext.Provider value={{ scrollY }}>
      {children}
    </HeaderAnimationContext.Provider>
  );
};

export const useHeaderAnimation = () => {
  const context = useContext(HeaderAnimationContext);
  if (!context) {
    throw new Error('useHeaderAnimation must be used within a HeaderAnimationProvider');
  }
  return context;
};
