import { View, StyleSheet, Dimensions, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Modal } from 'react-native';
import Header from '../components/header';
import Footer from '../components/footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Post } from '../index';
import PostView from '../components/post';
import { useRouter } from 'expo-router';

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
    const [posts, setPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<string[]>([]);
    const [friendsData, setFriendsData] = useState<any[]>([]);
    const [showFriendsModal, setShowFriendsModal] = useState(false);

    const router = useRouter();

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
                .select('username, first_name, last_name, profile_picture, banner_picture, friends')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setUsername(data.username ?? '');
            setFirstName(data.first_name ?? '');
            setLastName(data.last_name ?? '');
            setProfilePicture(data.profile_picture ?? null);
            setBannerPicture(data.banner_picture ?? null);
            setFriends(data.friends ?? []);

            await fetchFriendsData(data.friends ?? []);

        } catch (error) {
            Alert.alert('Error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchFriendsData(friendIds: string[]) {
        if (friendIds.length === 0) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, profile_picture, first_name, last_name')
            .in('id', friendIds);

        if (error) {
            console.error('Error fetching friends:', error);
        } else {
            setFriendsData(data || []);
        }
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    async function fetchPosts() {

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
        .from('posts')
        .select(`
            id,
            profile,
            post,
            comments,
            likes,
            profiles (
            username,          
            profile_picture
            )
        `)
        .eq('profile', user.id);

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data as any);
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

                            <TouchableOpacity onPress={updateProfile} disabled={saving} style={{ padding: 10, backgroundColor: '#A200FF', borderRadius: 5, opacity: saving ? 0.7 : 1, width: '30%' }}>
                                <Text style={{color: '#fff', textAlign: 'center'}}>{saving ? 'Saving...' : 'Save Profile'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogout} style={{ padding: 10, backgroundColor: '#ff0000', borderRadius: 5, opacity: saving ? 0.7 : 1, width: '30%' }}>
                                <Text style={{color: '#fff', textAlign: 'center'}}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
                <Footer />
            </View>
        );
    }

    const displayedFriends = friendsData.slice(0, 4);
    const hasMoreFriends = friendsData.length > 4;

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

                    <View style={{marginLeft: 125, marginTop: -5, marginBottom: 30, marginRight: 16}}>
                        <Text style={{fontWeight: 'bold', fontSize: 20}}>{firstName} {lastName}</Text>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between'}}>
                            <Text>@{username}</Text>
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <Text style={{color: "#A200FF"}}>Edit...</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text style={{paddingBottom: 10, fontSize: 15, fontWeight: 'bold', width: '100%', textAlign: 'center'}}>Your Friends</Text>
                        { friends.length > 0 
                        ? 
                        <View style={styles.friendsContainer}>
                            {displayedFriends.map(friend => (
                                <TouchableOpacity key={friend.id}
                                    onPress={() =>
                                        router.push({
                                        pathname: '/(profile)/friends',
                                        params: { friendId: friend.id },
                                    })
                                }>
                                    <View style={styles.friendItem}>
                                        <Image 
                                            source={{ uri: friend.profile_picture }} 
                                            style={styles.friendProfilePicture} 
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {hasMoreFriends && (
                                <TouchableOpacity 
                                    style={styles.moreButton}
                                    onPress={() => setShowFriendsModal(true)}
                                >
                                    <Text style={styles.moreButtonText}>+{friendsData.length - 4}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        :
                        <Text style={{textAlign: 'center', margin: 10}}>You have no friends yet.</Text>
                        }
                    </View>

                    <View style={styles.postsContainer}>
                        <View style={{width: '100%', height: 1, backgroundColor: 'black'}}></View>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{
                                alignItems: 'center',
                                paddingBottom: 20,
                                paddingTop: 10,
                                flexGrow: 1,
                            }}
                        >
                            <Text style={{fontSize: 15, fontWeight: 'bold', width: '100%', textAlign: 'center'}}>Your Posts</Text>
                            {
                                posts.length > 0 ?
                                posts.map(post => (
                                    <PostView 
                                        key={post.id} 
                                        post={post} 
                                        username={(post.profiles as any)?.username} 
                                        profilePicture={(post.profiles as any)?.profile_picture} 
                                        comments={post.comments} 
                                        canScroll={() => {}} 
                                    />
                                ))
                                :
                                <Text style={{textAlign: 'center', margin: 10}}>You have no posts yet.</Text>
                            }
                        </ScrollView>
                    </View>
                </View>

            </View>
            <Footer />

            <Modal
                visible={showFriendsModal}
                transparent={true}
                onRequestClose={() => setShowFriendsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>All Friends ({friendsData.length})</Text>
                            <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.modalFriendsContainer}>
                                {friendsData.map(friend => (
                                    <TouchableOpacity 
                                        key={friend.id} 
                                        style={styles.modalFriendItem}
                                        onPress={() => {
                                            router.push({
                                                pathname: '/(profile)/friends',
                                                params: { friendId: friend.id },
                                            })
                                        }}
                                    >
                                        <Image 
                                            source={{ uri: friend.profile_picture }} 
                                            style={styles.modalFriendProfilePicture} 
                                        />
                                        <View style={styles.modalFriendInfo}>
                                            <Text style={styles.modalFriendName}>
                                                {friend.first_name} {friend.last_name}
                                            </Text>
                                            <Text style={styles.modalFriendUsername}>@{friend.username}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        flex: 1,
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
        marginLeft: 16,
    },
    profilePicturePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
        marginLeft: 16,
    },
    textContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#fff',
        borderTopEndRadius: 20,
        borderTopStartRadius: 20,
        marginTop: -20,
        paddingBottom: 0,
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
    },
    postsContainer: {
        flex: 1,
        width: '100%',
        marginBottom: 90,
    },
    friendsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        width: '100%',
        marginBottom: 20,
        gap: (width - 32 - (60 * 5)) / 4,
    },
    friendItem: {
        alignItems: 'center',
    },
    friendProfilePicture: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    moreButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#A200FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    moreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.9,
        maxHeight: height * 0.7,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
    },
    modalScroll: {
        width: '100%',
    },
    modalFriendsContainer: {
        gap: 15,
    },
    modalFriendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    modalFriendProfilePicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    modalFriendInfo: {
        flex: 1,
    },
    modalFriendName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalFriendUsername: {
        fontSize: 14,
        color: '#666',
    },
});