import { View, Text, TextInput, Alert, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { theme } from '../../lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInWithEmail = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={signInWithEmail}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>
      <Link href="/sign-up" style={styles.link}>
        Don't have an account? Sign Up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: theme.typography.fonts.heading,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radii.m,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.fontSizes.m,
  },
  link: {
    marginTop: theme.spacing.m,
    textAlign: 'center',
    color: theme.colors.link,
    fontFamily: theme.typography.fonts.body,
  },
});
