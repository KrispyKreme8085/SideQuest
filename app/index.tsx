import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../supabase/supabase';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { session } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.email}>Logged in as: {session?.user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  email: { fontSize: 14, color: '#666', marginBottom: 32 },
  button: { backgroundColor: '#ef4444', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
