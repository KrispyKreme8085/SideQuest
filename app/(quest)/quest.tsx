import { View, Text, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';
import Header from '../components/header';
import Footer from '../components/footer';
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

export default function Quest() {

    const [loading, setLoading] = useState(true);
    const [ quest, setQuest ] = useState("")

    const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter.ttf'),
        'ITC Benguiat Std': require('../../assets/fonts/ITCBenguiatStd.ttf')
    })

    useEffect(() => {
        fetchQuest();
    }, []);

    async function fetchQuest() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('quests')
                .select('quest');

            if (error) throw error;
            if (!data || data.length === 0) {
                Alert.alert('No Quests Available');
                return;
            }

            const random = data[Math.floor(Math.random() * data.length)];

            setQuest(random.quest ?? '');

        } catch (error: any) {
            console.log(error);
            Alert.alert('Error', error.message || JSON.stringify(error));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.page}>
                <Header></Header>
                <View style={styles.body}>
                    <ActivityIndicator size="large"></ActivityIndicator>
                </View>
                <Footer></Footer>
            </View>
        );
    }

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.page}>
            <Header></Header>
            <View style={styles.body}>
                <Text style={[styles.text1, {fontFamily: 'Inter'}]}>Your Side Quest is...</Text>
                <Text style={[styles.text2, {fontFamily: 'ITC Benguiat Std'}]}>{quest}</Text>
            </View>
            <Footer></Footer>
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
        display: 'flex',
        alignItems: 'center',
        width,
        height,
    },
    text1: {
        fontSize: 20,
    },
    text2: {
        fontSize: 25,
        paddingTop: 20,
        color: "#A200FF"
    }
});


