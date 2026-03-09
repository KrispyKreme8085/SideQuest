import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../supabase/supabase';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { session } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>Home</Text>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>Logged in as: {session?.user?.email}</Text>
      <TouchableOpacity style={{ backgroundColor: '#ef4444', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' }} onPress={handleLogout}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

