import { View, Text, StyleSheet, Dimensions, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Comment } from '../index';
import { supabase } from '@/supabase/supabase';
import { useRouter } from 'expo-router';

interface Props {
    comments: Comment[];
    setComment: (comment: string) => void;
    comment: string;
    addComment: () => void;
}

interface CommentWithUsername extends Comment {
    profile_picture: string;
    username: string;
}

const { width, height } = Dimensions.get('window');

export default function CommentCard(props: Props) {
    const [commentsWithUsernames, setCommentsWithUsernames] = useState<CommentWithUsername[]>([]);

    const router = useRouter();

    useEffect(() => {
        const fetchUsernames = async () => {
            const commentsWithData = await Promise.all(
                props.comments.map(async (comment) => {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('username, profile_picture')
                        .eq('id', comment.profile)
                        .single();

                    return {
                        ...comment,
                        username: data?.username || 'Unknown User',
                        profile_picture: data?.profile_picture || ''
                    };
                })
            );
            setCommentsWithUsernames(commentsWithData);
        };

        fetchUsernames();
    }, [props.comments]);

    return (
        <View style={styles.commentCard}>
            <View style={{ display:'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                    style={styles.input}
                    placeholder='Add a Comment'
                    value={props.comment}
                    onChangeText={props.setComment}
                ></TextInput>
                <TouchableOpacity onPress={props.addComment}>
                    <Image source={require('../../assets/images/EmailSend.png')} style={{ width: 35, height: 35 }} />
                </TouchableOpacity>
            </View>
            <ScrollView
                style={{ height: height * 0.2 }}
                contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
            >
                {commentsWithUsernames.map((comment, index) => (
                    <View key={index} style={styles.comment}>
                        <TouchableOpacity style={styles.commentHeader} onPress={() => {
                            router.push({
                                pathname: '/(profile)/friends',
                                params: { friendId: comment.profile },
                            })
                        }}>
                            <Image source={{ uri: comment.profile_picture }} style={styles.img} />
                            <Text style={{ fontWeight: 'bold' }}>{comment.username}</Text>
                        </TouchableOpacity>
                        <Text>{comment.comment}</Text>
                    </View>
                ))}
                {commentsWithUsernames.length > 0 
                    ? <Text style={{paddingBottom: 40}}>No More Comments</Text> 
                    : <Text style={{paddingTop: 10}}>No Comments</Text>
                }
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    commentCard: {
        width: '100%',
        flex: 1,
        backgroundColor: '#fff',
        flexDirection: 'column',
        alignItems: 'center',
    },
    input: {
        height: 40,
        width: width * 0.75,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    comment: {
        padding: 10, 
        borderTopWidth: 1, 
        borderTopColor: 'black',
        width
    },
    commentHeader: {
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 5,
        gap: 10
    },
    img: { 
        width: 30, 
        height: 30, 
        borderRadius: 15 
    }
});