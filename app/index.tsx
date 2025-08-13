import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Welcome to your app</Text>
        <Text style={styles.text}>Ready to build something amazing?</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    color: "#1A1A1A",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    lineHeight: 24,
  },
});