import { View, Text, Alert, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabase';
import Header from '../components/header';
import Footer from '../components/footer';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router'; 

const { width, height } = Dimensions.get('window');

export default function Quest() {

    const [loading, setLoading] = useState(true);
    const [ quest, setQuest ] = useState("")
    const [completionMessage, setCompletionMessage] = useState(false);

    const router = useRouter()

    const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter.ttf'),
        'ITC Benguiat Std': require('../../assets/fonts/ITCBenguiatStd.ttf')
    })

    useEffect(() => {
        const checkDate = async () => {
            const today = new Date().toLocaleDateString('en-CA');

            const { data: { user } } = await supabase.auth.getUser();

            const { data: profile } = await supabase
                .from('profiles')
                .select('last_post_date')
                .eq('id', user!.id)
                .single();

            if (profile?.last_post_date !== today) {
                checkAndFetchQuest();
            } else {
                setCompletionMessage(true);
            }
        };

        checkDate();
    }, []);

    const getTodayDate = () => new Date().toLocaleDateString('en-CA');

    async function checkAndFetchQuest() {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('daily_quest, last_quest_date')
                .eq('id', user.id)
                .single();

            const today = getTodayDate();

            if (profile?.last_quest_date === today && profile?.daily_quest) {
                setQuest(profile.daily_quest);
            } else {
                await getNewDailyQuest(user.id, today);
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load quest');
        } finally {
            setLoading(false);
        }
    }

    if (completionMessage) {
        return (
            <View style={styles.page}>
                <Header></Header>
                <View style={styles.body}>
                    <Text style={[styles.text1, {fontFamily: 'Inter', padding: 30, textAlign: 'center'}]}>You've already completed your quest for today!</Text>
                </View>
                <Footer></Footer>
            </View>
        );
    }

    async function getNewDailyQuest(userId: string, today: string) {
        const { data: quests, error: questError } = await supabase
            .from('quests')
            .select('quest');

        if (questError) throw questError;
        if (!quests || quests.length === 0) {
            Alert.alert('No Quests Available');
            return;
        }

        const randomQuest = quests[Math.floor(Math.random() * quests.length)].quest;

        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                daily_quest: randomQuest,
                last_quest_date: today,
                updated_at: new Date().toISOString(),
            });

        if (updateError) throw updateError;

        setQuest(randomQuest);
    }

    if (loading || !fontsLoaded) {
        return (
            <View style={styles.page}>
                <Header></Header>
                <View style={styles.body}>
                    <Text style={[styles.text1, {fontFamily: 'Inter'}]}>Your Side Quest is...</Text>
                    <ActivityIndicator size="large" style={{marginTop: 30}}></ActivityIndicator>
                </View>
                <Footer></Footer>
            </View>
        );
    }

    return (
        <View style={styles.page}>
            <Header></Header>
            <View style={styles.body}>
                <Text style={[styles.text1, {fontFamily: 'Inter'}]}>Your Side Quest is...</Text>
                <Text style={[styles.text2, {fontFamily: 'ITC Benguiat Std'}]}>{quest}</Text>
                <TouchableOpacity style={styles.buttonParent} onPress={() => {router.push('/(quest)/camera')}}>
                    <Text style={[styles.button, {fontFamily: 'ITC Benguiat Std'}]}>Complete Quest</Text>
                </TouchableOpacity>
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
        height: height - 225
    },
    text1: {
        fontSize: 20,
    },
    text2: {
        fontSize: 25,
        padding: 20,
        paddingBottom: 0,
        color: "#A200FF",
    },
    buttonParent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFB703",
        padding: 10,
        borderRadius: 10,
        width: 225,
        marginTop: 20
    },
    button: {
        fontSize: 25,
    }
});
