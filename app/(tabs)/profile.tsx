import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ProfileScreen() {
  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  // Get user's stats
  const userSightings = useQuery(
    api.plantSightings.getUserSightings,
    demoUser ? { userId: demoUser._id } : "skip"
  );
  const userTours = useQuery(
    api.tours.getUserTours,
    demoUser ? { userId: demoUser._id } : "skip"
  );

  const identifiedCount = userSightings?.filter(s => s.identificationStatus === "identified").length || 0;
  const pendingCount = userSightings?.filter(s => s.identificationStatus === "pending").length || 0;

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/pricing");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert("Coming Soon", "Profile editing will be available in a future update!");
  };

  const handleSettings = () => {
    Alert.alert("Coming Soon", "Settings will be available in a future update!");
  };

  const handleHelp = () => {
    Alert.alert(
      "PlantMapper Help",
      "• Take photos to identify plants\n• Create tours to share discoveries\n• Tap the sparkles icon for AI-enhanced descriptions\n• Use manual entry if you know the plant name",
      [{ text: "Got it!" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#22C55E" />
          </View>
          <Text style={styles.userName}>
            {demoUser?.name || "Plant Explorer"}
          </Text>
          <Text style={styles.userEmail}>
            {demoUser?.email || "demo@plantmapper.com"}
          </Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={16} color="#6B7280" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="leaf" size={32} color="#22C55E" />
              <Text style={styles.statNumber}>{userSightings?.length || 0}</Text>
              <Text style={styles.statLabel}>Total Sightings</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color="#3B82F6" />
              <Text style={styles.statNumber}>{identifiedCount}</Text>
              <Text style={styles.statLabel}>Identified</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trail-sign" size={32} color="#8B5CF6" />
              <Text style={styles.statNumber}>{userTours?.length || 0}</Text>
              <Text style={styles.statLabel}>Tours Created</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="time" size={32} color="#F59E0B" />
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending ID</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/camera")}>
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={24} color="#22C55E" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add Plant Sighting</Text>
              <Text style={styles.actionDescription}>Take a photo and identify a new plant</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/create-tour")}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create New Tour</Text>
              <Text style={styles.actionDescription}>Build a guided plant discovery experience</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/(tabs)/sightings")}>
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={24} color="#3B82F6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View All Sightings</Text>
              <Text style={styles.actionDescription}>Browse your plant discovery history</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleUpgrade}>
            <View style={styles.settingIcon}>
              <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Upgrade to Pro</Text>
              <Text style={styles.settingDescription}>Unlock unlimited identifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSettings}>
            <View style={styles.settingIcon}>
              <Ionicons name="settings" size={24} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Settings</Text>
              <Text style={styles.settingDescription}>App preferences and notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle" size={24} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>Get help using PlantMapper</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingIcon}>
              <Ionicons name="log-out" size={24} color="#EF4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: "#EF4444" }]}>Sign Out</Text>
              <Text style={styles.settingDescription}>Return to welcome screen</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  actionsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  settingsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
});