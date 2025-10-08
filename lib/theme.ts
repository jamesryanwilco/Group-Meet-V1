const palette = {
  // Primary Colors
  teal: '#00A884', // A vibrant, accessible green for primary actions
  tealDark: '#008069', // For press/hover states on primary actions

  // Neutral Colors (Dark Mode)
  dark1: '#111B21', // Main background - a very dark, slightly blue charcoal
  dark2: '#202C33', // Component/Card backgrounds
  dark3: '#2A3942', // Borders, dividers, and pressed states for secondary elements
  dark4: '#54656F', // Secondary text, icons

  // Accent & Text Colors
  light1: '#E9EDEF', // Primary text
  light2: '#AEBAC1', // Secondary/placeholder text
  lightBlue: '#53BDEB', // For links or special highlights (like sender's name in chat)

  // System Colors
  error: '#F15C6D',
  success: '#00A884',
};

export const theme = {
  colors: {
    background: palette.dark1,
    card: palette.dark2,
    primary: palette.teal,
    primaryDark: palette.tealDark,
    text: palette.light1,
    textSecondary: palette.light2,
    placeholder: palette.dark4,
    border: palette.dark3,
    link: palette.lightBlue,
    error: palette.error,
    success: palette.success,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  typography: {
    // We will load these fonts in the root layout
    fonts: {
      body: 'Inter_400Regular',
      heading: 'Inter_700Bold',
      medium: 'Inter_500Medium',
    },
    fontSizes: {
      xs: 12,
      s: 14,
      m: 16,
      l: 20,
      xl: 24,
    },
  },
  radii: {
    s: 5,
    m: 8,
    l: 12,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
  },
};
