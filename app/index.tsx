import { View, StyleSheet, Dimensions } from 'react-native';
import { supabase } from '../supabase/supabase';
import Header from './components/header';
import Footer from './components/footer';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  // const { session } = useAuth();

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
    width: width,
    height: height
  }
})

