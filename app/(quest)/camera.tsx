'use client';

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { supabase } from '@/supabase/supabase';
import { useRouter } from 'expo-router';
import Header from '../components/header';
import Footer from '../components/footer';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Camera() {
    const [permission, requestPermission] = useCameraPermissions();
    const [camera, setCamera] = useState<CameraView | null>(null);
    const [uploading, setUploading] = useState(false);
    const [facing, setFacing] = useState<'front' | 'back'>('back');

    const router = useRouter();

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.page}>
                <Header />
                <View style={styles.permissionBody}>
                    <Text style={styles.permissionText}>
                        Camera access is required
                    </Text>
                    <Button onPress={requestPermission} title="Grant Permission" />
                </View>
                <Footer />
            </View>
        );
    }

    const captureImage = async () => {
        if (permission.granted && camera) {
            const photo = await camera.takePictureAsync({ base64: true });
            await uploadImage(photo.uri);
        }
    };

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

            const updatedPosts = [...(profile.posts || []), newPost.id];

            await supabase
                .from('profiles')
                .update({
                    posts: updatedPosts,
                    last_post_date: new Date().toLocaleDateString('en-CA')
                })
                .eq('id', user.id);

            router.push('/(quest)/quest');

        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.page}>
            <Header />

            {/* CAMERA AREA */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    ref={ref => setCamera(ref)}
                    facing={facing}
                />

                {/* TOP OVERLAY CONTROLS */}
                <View style={styles.topControls}>
                    <TouchableOpacity
                        style={styles.flipButton}
                        onPress={() =>
                            setFacing(prev => (prev === 'back' ? 'front' : 'back'))
                        }
                    >
                        <Ionicons name="camera-reverse" size={26} color="white" />
                    </TouchableOpacity>
                </View>

                {/* BOTTOM CONTROLS */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.shutterButton}
                        onPress={captureImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={styles.shutterInner} />
                        )}
                    </TouchableOpacity>

                    <Text style={styles.hintText}>
                        Tap to capture
                    </Text>
                </View>
            </View>

            <Footer />
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#000',
    },

    cameraContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },

    camera: {
        position: 'absolute',
        width,
        height: height - 90 - 120, // footer + header approximation
    },

    topControls: {
        position: 'absolute',
        top: 10,
        right: 15,
    },

    flipButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    controls: {
        position: 'absolute',
        bottom: 110, // keeps above footer (90px)
        width: '100%',
        alignItems: 'center',
        gap: 10,
    },

    shutterButton: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 5,
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },

    shutterInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'white',
    },

    hintText: {
        color: 'white',
        fontSize: 12,
        opacity: 0.7,
    },

    permissionBody: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    permissionText: {
        textAlign: 'center',
        color: 'white',
    },
});