import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Modal } from 'react-native';
import Header from '../components/header';
import Footer from '../components/footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';
import { Post } from '../index';
import PostView from '../components/post';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Friend() {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [bannerPicture, setBannerPicture] = useState<string | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<string[]>([]);
    const [friendsData, setFriendsData] = useState<any[]>([]);
    const [showFriendsModal, setShowFriendsModal] = useState(false);

    const { friendId } = useLocalSearchParams<{ friendId: string }>();

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('profiles')
                .select('username, first_name, last_name, profile_picture, banner_picture, friends')
                .eq('id', friendId)
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
        .eq('profile', friendId);

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data as any);
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
                        </View>
                    </View>

                    <View>
                        <Text style={{paddingBottom: 10, fontSize: 15, fontWeight: 'bold', width: '100%', textAlign: 'center'}}>{firstName}'s Friends</Text>
                        { friends.length > 0 
                        ? 
                        <View style={styles.friendsContainer}>
                            {displayedFriends.map(friend => (
                                <View key={friend.id} style={styles.friendItem}>
                                    <Image 
                                        source={{ uri: friend.profile_picture }} 
                                        style={styles.friendProfilePicture} 
                                    />
                                </View>
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
                        <Text style={{textAlign: 'center', margin: 10}}>{firstName} has no friends yet.</Text>
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
                            <Text style={{fontSize: 15, fontWeight: 'bold', width: '100%', textAlign: 'center'}}>{firstName}'s Posts</Text>
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
                                <Text style={{textAlign: 'center', margin: 10}}>{firstName} has no posts yet.</Text>
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
                                    <View key={friend.id} style={styles.modalFriendItem}>
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
                                    </View>
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