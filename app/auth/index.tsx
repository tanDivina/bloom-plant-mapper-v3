import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { isWeb } from "../../utils/platform";

type AuthMode = "signin" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createUser = useMutation(api.users.createUser);
  const signInUser = useMutation(api.auth.signInUser);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      Alert.alert("Missing Information", "Please enter your name.");
      return;
    }

    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        await createUser({
          email: email.trim(),
          name: name.trim(),
          password: password.trim(),
        });
        Alert.alert(
          "Account Created! 🎉",
          "Welcome to PlantMapper! You can now start discovering plants.",
          [{ text: "Get Started", onPress: () => router.replace("/(tabs)") }]
        );
      } else {
        const result = await signInUser({
          email: email.trim(),
          password: password.trim(),
        });
        
        if (result.success) {
          router.replace("/(tabs)");
        } else {
          Alert.alert("Sign In Failed", result.error || "Invalid credentials.");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMode(mode === "signin" ? "signup" : "signin");
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSkipAuth = () => {
    // Continue with demo mode
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#22C55E", "#16A34A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>PlantMapper</Text>
          <Text style={styles.subtitle}>
            {mode === "signin" ? "Welcome back!" : "Join the community"}
          </Text>
        </View>

        {/* Auth Form */}
        <View style={styles.formContainer}>
          <View style={styles.form}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.authButtonText}>
                {isLoading 
                  ? (mode === "signin" ? "Signing In..." : "Creating Account...")
                  : (mode === "signin" ? "Sign In" : "Create Account")
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={switchMode}>
              <Text style={styles.switchText}>
                {mode === "signin" 
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Mode */}
          <View style={styles.demoSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.demoButton} onPress={handleSkipAuth}>
              <Ionicons name="play-outline" size={20} color="#22C55E" />
              <Text style={styles.demoButtonText}>Try Demo Mode</Text>
            </TouchableOpacity>
            <Text style={styles.demoDescription}>
              Explore PlantMapper without creating an account
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="camera" size={20} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.featureText}>AI Plant ID</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="map" size={20} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.featureText}>Location Mapping</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trail-sign" size={20} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.featureText}>Guided Tours</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  authButton: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  switchText: {
    color: "#6B7280",
    fontSize: 14,
  },
  demoSection: {
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginHorizontal: 16,
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 8,
  },
  demoButtonText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "500",
  },
  demoDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    textAlign: "center",
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  feature: {
    alignItems: "center",
    gap: 4,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
});