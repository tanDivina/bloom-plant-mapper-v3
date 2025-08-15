import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function SightingsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "identified" | "pending">("all");
  
  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  // Get user's sightings
  const sightings = useQuery(
    api.plantSightings.getUserSightings, 
    demoUser ? { userId: demoUser._id } : "skip"
  );

  const deleteSighting = useMutation(api.plantSightings.deleteSighting);

  const filteredSightings = sightings?.filter(sighting => {
    if (selectedFilter === "all") return true;
    return sighting.identificationStatus === selectedFilter;
  }) || [];

  const handleAddSighting = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/camera");
  };

  const handleSightingPress = (sightingId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/sighting/${sightingId}`);
  };

  const handleDeleteSighting = async (sightingId: string, plantName: string) => {
    Alert.alert(
      "Delete Sighting",
      `Are you sure you want to delete this sighting of "${plantName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSighting({ sightingId });
              Alert.alert("Success", "Sighting deleted successfully");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete sighting");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Sightings</Text>
          <Text style={styles.subtitle}>
            {filteredSightings.length} sighting{filteredSightings.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSighting}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: "all", label: "All", count: sightings?.length || 0 },
          { key: "identified", label: "Identified", count: sightings?.filter(s => s.identificationStatus === "identified").length || 0 },
          { key: "pending", label: "Pending", count: sightings?.filter(s => s.identificationStatus === "pending").length || 0 },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sightings List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sightings === undefined ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading sightings...</Text>
          </View>
        ) : filteredSightings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No sightings yet</Text>
            <Text style={styles.emptyText}>
              Start by taking a photo of a plant to create your first sighting
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddSighting}>
              <Ionicons name="camera" size={20} color="#22C55E" />
              <Text style={styles.emptyButtonText}>Add First Sighting</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sightingsList}>
            {filteredSightings.map((sighting) => (
              <TouchableOpacity
                key={sighting._id}
                style={styles.sightingCard}
                onPress={() => handleSightingPress(sighting._id)}
              >
                <View style={styles.sightingInfo}>
                  <View style={styles.sightingHeader}>
                    <Text style={styles.sightingName}>
                      {sighting.plantProfile?.commonNames[0] || 
                       sighting.userProvidedName || 
                       "Unknown Plant"}
                    </Text>
                    <View style={styles.badgeContainer}>
                      {/* AI Enhancement Badge */}
                      {sighting.plantProfile?.description && (
                        <View style={styles.aiBadge}>
                          <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                        </View>
                      )}
                      {/* Status Badge */}
                      <View style={[
                        styles.statusBadge,
                        sighting.identificationStatus === "identified" && styles.statusIdentified,
                        sighting.identificationStatus === "pending" && styles.statusPending,
                        sighting.identificationStatus === "failed" && styles.statusFailed,
                      ]}>
                        <Text style={[
                          styles.statusText,
                          sighting.identificationStatus === "identified" && styles.statusTextIdentified,
                        ]}>
                          {sighting.identificationStatus === "identified" ? "✓" : 
                           sighting.identificationStatus === "pending" ? "..." : "!"}
                        </Text>
                      </View>
                      
                      {/* Delete Button for User's Own Sightings */}
                      {demoUser && sighting.userId === demoUser._id && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteSighting(
                            sighting._id, 
                            sighting.plantProfile?.commonNames[0] || sighting.userProvidedName || "Unknown Plant"
                          )}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  {sighting.plantProfile?.scientificName && (
                    <Text style={styles.scientificName}>
                      {sighting.plantProfile.scientificName}
                    </Text>
                  )}

                  {/* AI Description Preview */}
                  {sighting.plantProfile?.description && (
                    <Text style={styles.aiDescription} numberOfLines={2}>
                      🤖 {sighting.plantProfile.description}
                    </Text>
                  )}
                  
                  <Text style={styles.sightingLocation}>
                    📍 {sighting.location.address || 
                     `${sighting.location.latitude.toFixed(4)}, ${sighting.location.longitude.toFixed(4)}`}
                  </Text>
                  
                  <Text style={styles.sightingDate}>
                    {new Date(sighting._creationTime).toLocaleDateString()}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#22C55E",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterTabActive: {
    backgroundColor: "#22C55E",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 2,
    borderColor: "#22C55E",
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  sightingsList: {
    gap: 12,
    paddingBottom: 20,
  },
  sightingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sightingInfo: {
    flex: 1,
  },
  sightingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sightingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  statusIdentified: {
    backgroundColor: "#22C55E",
  },
  statusPending: {
    backgroundColor: "#F59E0B",
  },
  statusFailed: {
    backgroundColor: "#EF4444",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6B7280",
  },
  statusTextIdentified: {
    color: "#FFFFFF",
  },
  deleteButton: {
    padding: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 13,
    color: "#8B5CF6",
    fontStyle: "italic",
    marginBottom: 4,
    lineHeight: 18,
  },
  sightingLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  sightingDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});