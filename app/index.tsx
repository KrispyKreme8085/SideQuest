import { View, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '../supabase/supabase';
import Header from './components/header';
import Footer from './components/footer';
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  // const { session } = useAuth();

  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter.ttf'),
    'ITC Benguiat Std': require('../assets/fonts/ITCBenguiatStd.ttf')
  })

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.page}>
      <Header></Header>
      <View>

      </View>
      <Footer></Footer>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter",
    width: width,
    height: height
  }
})

