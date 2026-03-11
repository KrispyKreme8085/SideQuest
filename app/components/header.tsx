import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function Header() {
    return (
        <View style={styles.header}>
            <Image source={require('../../assets/images/SideQuestText.png')} style={styles.logo} resizeMode='contain' />
        </View>
    );
}

const styles = StyleSheet.create({
    header: { 
        display: "flex", 
        width: width, 
        alignItems: "center", 
        paddingTop: 50, 
        backgroundColor: "#FFB703", 
        borderBottomWidth: 2, 
        borderBottomColor: "#000" 
    },

    logo: { 
        width: 150,
    },
})

