import { View, StyleSheet, Dimensions, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/header';
import Footer from '../components/footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';

const { width, height } = Dimensions.get('window');

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('username, first_name, last_name')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setUsername(data.username ?? '');
            setFirstName(data.first_name ?? '');
            setLastName(data.last_name ?? '');

        } catch (error) {
            Alert.alert('Error');
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            Alert.alert('Success', 'Profile updated!');

        } catch (error) {
            Alert.alert('Error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.page}>
                <Header />
                <View>
                    <ActivityIndicator size="large" />
                </View>
                <Footer />
            </View>
        );
    }

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    return (
        <View style={styles.page}>
            <Header />
            <View style={styles.body}>
                <Text>Username</Text>
                <TextInput
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <Text>First Name</Text>
                <TextInput
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                />

                <Text>Last Name</Text>
                <TextInput
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />

                <TouchableOpacity
                    onPress={updateProfile}
                    disabled={saving}
                >
                    <Text>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout}>
                    <Text>Logout</Text>
                </TouchableOpacity>
            </View>
            <Footer />
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
    },
    body: {
        padding: 20,
    },
});