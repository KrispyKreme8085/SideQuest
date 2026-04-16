'use client'

import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Modal, Alert } from 'react-native';
import { Post } from '../index';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/supabase/supabase';
import CommentCard from './commentCard';
import { Comment } from '../index';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Props {
    post: Post;
    username: string;
    profilePicture: string;
    comments: Comment[];
    canScroll: (canScroll: boolean) => void;
}

export default function PostView(props: Props) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(props.post.likes ?? 0);
    const [userId, setUserId] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [comment, setComment] = useState('');

    const router = useRouter();

    useEffect(() => {
        getUserAndCheckLike();
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);
    
    async function fetchProfile() {
        try {
    
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (error) throw error;
    
            setProfileId(data.id);

        } catch (error) {
            Alert.alert('Error');
        } finally {
                
        }
    }

    async function addComment() {
        if (!profileId) {
            alert('Profile not loaded yet.');
            return;
        }

        if (!comment.trim()) {
            alert('Comment cannot be empty.');
            return;
        }

        try {
            const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('comments')
                .eq('id', props.post.id)
                .single();

            if (fetchError) throw fetchError;

            const existingComments = postData?.comments ?? [];

            const newComment = {
                profile: profileId,
                comment: comment.trim(),
            };

            const { error: updateError } = await supabase
                .from('posts')
                .update({
                    comments: [...existingComments, newComment],
                })
                .eq('id', props.post.id);

            if (updateError) throw updateError;

            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment.');
        }
    }

    useEffect(() => {
        if (showComments) {
            props.canScroll(false);
        } else {
            props.canScroll(true);
        }
    }, [showComments]);

    async function getUserAndCheckLike() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data } = await supabase
            .from('posts')
            .select('liked_by')
            .eq('id', props.post.id)
            .single();

        if (data?.liked_by?.includes(user.id)) {
            setLiked(true);
        }
    }

    async function toggleLike() {
        if (!userId) {
            alert('No userId');
            return;
        }

        const newLiked = !liked;
        const newCount = newLiked ? likeCount + 1 : likeCount - 1;

        setLiked(newLiked);
        setLikeCount(newCount);

        const { data, error: fetchError } = await supabase
            .from('posts')
            .select('liked_by, likes')
            .eq('id', props.post.id)
            .single();

        if (fetchError) {
            alert(`Fetch error: ${fetchError}`);
            return;
        }

        const likedBy: string[] = data.liked_by ?? [];
        const updatedLikedBy = newLiked
            ? [...likedBy, userId]
            : likedBy.filter((id: string) => id !== userId);

        const { error: updateError } = await supabase
            .from('posts')
            .update({
                likes: newCount,
                liked_by: updatedLikedBy,
            })
            .eq('id', props.post.id);

        if (updateError) {
            alert(`Update error: ${updateError}`);
            setLiked(liked);
            setLikeCount(likeCount);
        }
    }

    const formatLikes = (count: number): string => {
        if (count > 999999) return `${(count / 1000000).toFixed(1)}m`;
        if (count > 999) return `${(count / 1000).toFixed(1)}k`;
        return `${count}`;
    };

    return (
        <View style={styles.post}>
            <TouchableOpacity style={styles.profileContainer} onPress={() => {
                router.push({
                    pathname: '/(profile)/friends',
                    params: { friendId: props.post.profile },
            })
            }}>
                <Image source={{ uri: props.profilePicture }} style={styles.profilePicture} />
                <Text style={styles.username}>{props.username}</Text>
            </TouchableOpacity>
            <Text style={styles.quest}>{props.post.post.quest}</Text>
            <Image source={{ uri: props.post.post.post_picture }} style={styles.image} />
            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.likeContainer, liked && styles.likeContainerActive]}
                    onPress={toggleLike}
                >
                    <Image style={styles.likeImg} source={require('../../assets/images/ThumbsUp.png')} />
                    <Text style={styles.likeText}>{formatLikes(likeCount)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.chatContainer}
                    onPress={() => setShowComments(true)}
                >
                    <Image style={styles.likeImg} source={require('../../assets/images/ChatBubble.png')} />
                    <Text style={styles.likeText}>{formatLikes(props.comments ? props.comments.length : 0)}</Text>
                </TouchableOpacity>
            </View>
            <Modal
                visible={showComments}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.topHalf}
                        activeOpacity={1}
                        onPress={() => setShowComments(false)}
                    />
                    <View style={styles.modalContent}>
                        <CommentCard comments={props.comments} setComment={setComment} comment={comment} addComment={addComment}/>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    post: {
        margin: 10,
        marginBottom: 0,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    profilePicture: {
        width: 25,
        height: 25,
        borderRadius: 25,
        marginLeft: 5,
        marginRight: 5,
    },
    username: {
        color: 'black',
    },
    quest: {
        fontSize: 18,
        marginLeft: 5,
        marginRight: 5,
    },
    image: {
        width,
        height: height / 4,
    },
    buttons: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 5,
        marginLeft: 5,
        backgroundColor: '#FFB703',
        width: 100,
        padding: 5,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'black',
    },
    likeContainerActive: {
        backgroundColor: '#A200FF',
    },
    likeImg: {
        width: 30,
        height: 30,
    },
    likeText: {
        color: 'black',
        fontSize: 16,
    },
    chatContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 5,
        marginLeft: 5,
        width: 100,
        padding: 5,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'black',
    },
    modal: {
        width,
        height: height / 2,
    },
    topHalf: {
        height: height / 2,
        width: '100%',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },

    modalContent: {
        width: '100%',
        height: height / 2,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
});