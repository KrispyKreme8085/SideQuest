import { View, StyleSheet, Dimensions, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import Header from '../components/header';
import Footer from '../components/footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [bannerPicture, setBannerPicture] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

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
                .select('username, first_name, last_name, profile_picture, banner_picture')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setUsername(data.username ?? '');
            setFirstName(data.first_name ?? '');
            setLastName(data.last_name ?? '');
            setProfilePicture(data.profile_picture ?? null);
            setBannerPicture(data.banner_picture ?? null);

            // alert(`${profilePicture}`)

        } catch (error) {
            Alert.alert('Error');
        } finally {
            setLoading(false);
        }
    }

    async function pickAndUploadImage(bucket: 'profile-pictures' | 'banner-pictures'): Promise<string | null> {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: bucket === 'profile-pictures' ? [1, 1] : [3, 1],
            quality: 0.8,
        });

        if (result.canceled) return null;

        const uri = result.assets[0].uri;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const fileName = bucket === 'profile-pictures' ? 'profile.jpg' : 'banner.jpg';
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return `${publicUrl}?t=${Date.now()}`;
    }

    async function handlePickProfilePicture() {
        try {
            const url = await pickAndUploadImage('profile-pictures');
            if (url) setProfilePicture(url);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload profile picture');
        }
    }

    async function handlePickBannerPicture() {
        try {
            const url = await pickAndUploadImage('banner-pictures');
            if (url) setBannerPicture(url);
        } catch (error) {
            Alert.alert('Error', 'Failed to upload banner picture');
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
                    profile_picture: profilePicture,
                    banner_picture: bannerPicture,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setIsEditing(false);

        } catch (error) {
            Alert.alert('Error');
        } finally {
            setSaving(false);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
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

    if (isEditing) {
        return (
            <View style={styles.page}>
                <Header />
                <View style={styles.body}>
                    <TouchableOpacity onPress={handlePickBannerPicture}>
                        <View style={styles.bannerContainer}>
                            {bannerPicture
                                ? <Image source={{ uri: bannerPicture }} style={styles.banner} />
                                : <View style={styles.bannerPlaceholder} />
                            }
                        </View>
                    </TouchableOpacity>

                    <View style={styles.textContainer}>
                        <TouchableOpacity onPress={handlePickProfilePicture} style={styles.profilePictureWrapper}>
                            {profilePicture
                                ? <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                                : <View style={styles.profilePicturePlaceholder} />
                            }
                        </TouchableOpacity>
                        
                        <View style={styles.inputContainer}>
                            <Text>First Name</Text>
                            <TextInput
                                placeholder="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                                style={styles.input}
                            />

                            <Text>Last Name</Text>
                            <TextInput
                                placeholder="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                                style={styles.input}
                            />

                            <Text>Username</Text>
                            <TextInput
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                style={styles.input}
                            />

                            <TouchableOpacity onPress={updateProfile} disabled={saving} style={{ padding: 10, backgroundColor: '#A200FF', borderRadius: 5, opacity: saving ? 0.7 : 1 }}>
                                <Text style={{color: '#fff'}}>{saving ? 'Saving...' : 'Save Profile'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
                <Footer />
            </View>
        );
    }

    return (
        <View style={styles.page}>
            <Header />
            <View style={styles.body}>
                <View style={styles.bannerContainer}>
                    {bannerPicture
                        ? <Image source={{ uri: bannerPicture }} style={styles.banner} />
                        : <View style={styles.bannerPlaceholder} />
                    }
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.profilePictureWrapper}>
                        {profilePicture
                            ? <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                            : <View style={styles.profilePicturePlaceholder} />
                        }
                    </View>
                    <View style={{marginLeft: 120, marginTop: -5, marginBottom: 30}}>
                        <Text style={{fontWeight: 'bold', fontSize: 20}}>{firstName} {lastName}</Text>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between'}}>
                            <Text>@{username}</Text>
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <Text style={{color: "#A200FF"}}>Edit...</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text>Your Posts</Text>
                    </View>

                    <View style={[styles.inputContainer, {marginTop: 20}]}>
                        <TouchableOpacity onPress={handleLogout} style={{ padding: 10, backgroundColor: '#ff0000', borderRadius: 5, opacity: saving ? 0.7 : 1 }}>
                            <Text style={{color: '#fff'}}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
        
    },
    bannerContainer: {
        width,
        height: 135,
        marginBottom: 12,
        overflow: 'hidden',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ccc',
    },
    profilePictureWrapper: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    profilePictureContainer: {
        alignItems: 'center',
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 100,
        position: 'absolute',
        top: -30,
        borderWidth: 1,
        borderColor: 'black',
    },
    profilePicturePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
    },
    textContainer: {
        width,
        height,
        backgroundColor: '#fff',
        paddingLeft: 16,
        paddingRight: 16,
        position: 'absolute',
        borderTopEndRadius: 20,
        borderTopStartRadius: 20,
        top: 120,
        paddingBottom: 20,
    },
    inputContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    input: {
        width: '40%',
        borderWidth: 1,
        borderColor: '#000000',
    }
});