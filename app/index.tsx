import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { supabase } from '../supabase/supabase';
import Header from './components/header';
import Footer from './components/footer';
import { useFonts } from 'expo-font';
import { useState, useEffect } from 'react';
import PostView from './components/post';

const { width, height } = Dimensions.get('window');

export interface Comment {
  profile: string;
  comment: string;
}

export interface Post {
  id: string;
  profile: string;
  post: {
    quest: string;
    post_picture: string;
  };
  comments: Comment[];
  likes: number;
  profiles: {
    username: string;
    profile_picture: string;
  };
}

export default function HomeScreen() {

  const [posts, setPosts] = useState<Post[]>([]);
  const [canScroll, setCanScroll] = useState(true);

  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter.ttf'),
    'ITC Benguiat Std': require('../assets/fonts/ITCBenguiatStd.ttf')
  })

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {          
          const { data: updatedPost, error } = await supabase
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
            .eq('id', payload.new.id)
            .single();

          if (!error && updatedPost) {
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === updatedPost.id ? updatedPost as any : post
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      `);

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data as any);
    }
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.page}>
      <Header />
      <ScrollView 
        contentContainerStyle={styles.body}
        scrollEnabled={canScroll}
      > 
        {posts.map(post => (
          <PostView key={post.id} post={post} username={(post.profiles as any)?.username} profilePicture={(post.profiles as any)?.profile_picture} comments={post.comments} canScroll={setCanScroll} />
        ))}
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: "column",
    fontFamily: "Inter",
    width: width,
  },
  body: {
    alignItems: 'center',
    paddingBottom: 100,
  }
})