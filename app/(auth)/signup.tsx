import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase/supabase';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isAccountDetails, setIsAccountDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setIsAccountDetails(true);
  }

  async function completeSignUp() {
    if (!firstName || !lastName || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        Alert.alert('Sign Up Error', error.message);
        setLoading(false);
        return;
      }
      
      if (!data.user) {
        Alert.alert('Error', 'Failed to create user account');
        setLoading(false);
        return;
      }
      
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        username: username
      });
      
      if (profileError) {
        Alert.alert('Profile Error', profileError.message);
        setLoading(false);
        return;
      }
      
      Alert.alert('Success', 'Account created successfully!');
      router.push('/'); 
      
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (isAccountDetails) {
    return (
      <View style={styles.container}>
        <Image source={require('../../assets/images/SideQuestLogo.png')} style={styles.logo} resizeMode='contain' />
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter First Name..."
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Last Name..."
          placeholderTextColor="#999"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Username..."
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />

        <TouchableOpacity style={styles.button} onPress={completeSignUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={() => setIsAccountDetails(false)} disabled={loading}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Email..."
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Password..."
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password..."
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { display: 'flex', flexDirection: "column", justifyContent: 'center', width: width, height: height, alignItems: "center", padding: 24, backgroundColor: '#fff' },
  logo: { width: 200,},
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, width: "100%" },
  button: { backgroundColor: '#FFB703', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16, width: 150 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#000', fontSize: 14 },
  button2: { borderWidth: 2, borderColor: 'black', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16, width: 150 },
  // buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});