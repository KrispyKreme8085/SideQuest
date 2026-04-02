'use client';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, use } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '@/supabase/supabase';
import { useRouter } from 'expo-router'; 
import Header from '../components/header';
import Footer from '../components/footer';

const { width, height } = Dimensions.get('window');

export default function Camera() {
    const [permission, requestPermission] = useCameraPermissions();
    const [camera, setCamera] = useState<CameraView | null>(null);
    const [uploading, setUploading] = useState(false);

    const router = useRouter();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.page}>
                <Header></Header>
                <View style={styles.body}>
                    <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
                    <Button onPress={requestPermission} title="Grant Permission" />
                </View>
                <Footer></Footer>
            </View>
        );
    }

    const captureImage = async () => {
        if (permission.granted && camera) {
            const photo = await camera.takePictureAsync({ base64: true });
            await uploadImage(photo.uri);
        }
    }

    const uploadImage = async (uri: string) => {
        try {
            setUploading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const postId = Date.now().toString();
            const filePath = `${user.id}/${postId}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('post-pictures')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-pictures')
                .getPublicUrl(filePath);

            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('posts, daily_quest')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;

            const { data: newPost, error: postError } = await supabase
                .from('posts')
                .insert({
                    profile: user.id,
                    post: { post_picture: publicUrl, quest: profile.daily_quest }
                })
                .select('id')
                .single();

            if (postError) throw postError;

            const updatedPosts = [
                ...(profile.posts || []),
                newPost.id,
            ];

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    posts: updatedPosts,
                    last_post_date: new Date().toLocaleDateString('en-CA')
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            router.push('/(quest)/quest');

        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    }

    return (
        <View style={styles.page}>
            <Header></Header>
            <View style={styles.body}>
                <Text>{}</Text>
                <CameraView 
                    style={styles.camera} 
                    ref={ref => setCamera(ref)}
                />
                <View>
                    <TouchableOpacity 
                        style={[uploading && { opacity: 0.5 }]} 
                        onPress={captureImage}
                        disabled={uploading}
                    >
                        {uploading 
                            ? <ActivityIndicator color="black" />
                            : <Text>Take Photo</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
            <Footer></Footer>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        display: 'flex',
        flexDirection: 'column',
        width: width,
        height: height,
    },
    body: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    camera: {
        width: width,
        height: height / 3,
        marginTop: 10
    },
})
