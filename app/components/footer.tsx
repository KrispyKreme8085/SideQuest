import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router'; 

const { width } = Dimensions.get('window');

export default function Footer() {

    const router = useRouter()

    return (
        <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/')}>
                <Image source={require('../../assets/images/HomePage.png')} style={styles.buttons} resizeMode='contain' />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/#TODO')}>
                <Image source={require('../../assets/images/SideQuestIcon.png')} style={styles.buttons} resizeMode='contain' />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(profile)/profile')}>
                <Image source={require('../../assets/images/Profile.png')} style={styles.buttons} resizeMode='contain' />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        width: width, 
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        position: "absolute",
        bottom: 1,
        borderTopWidth: 2, 
        borderTopColor: "#000", 
        padding: 10,
        paddingBottom: 20
    },

    buttons: {
        width: 50,
        height: 50
    },
})
 