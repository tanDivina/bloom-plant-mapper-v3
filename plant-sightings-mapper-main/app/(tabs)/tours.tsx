import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ToursScreen() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "my" | "public">("all");
  
  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  // Get tours based on filter
  const publicTours = useQuery(api.tours.getPublicTours);
  const myTours = useQuery(
    api.tours.getUserTours,
    demoUser ? { userId: demoUser._id } : "skip"
  );

  const deleteTour = useMutation(api.tours.deleteTour);

  const filteredTours = (() => {
    if (selectedFilter === "my") return myTours || [];
    if (selectedFilter === "public") return publicTours || [];
    // For "all", combine both public and user tours
    const allTours = [...(publicTours || []), ...(myTours || [])];
    // Remove duplicates (in case user has public tours)
    const uniqueTours = allTours.filter((tour, index, self) => 
      index === self.findIndex(t => t._id === tour._id)
    );
    return uniqueTours;
  })();

  const handleCreateTour = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/create-tour");
  };

  const handleTourPress = (tourId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/tour/${tourId}`);
  };

  const handleDeleteTour = async (tourId: string, tourName: string) => {
    Alert.alert(
      "Delete Tour",
      `Are you sure you want to delete "${tourName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTour({ tourId });
              Alert.alert("Success", "Tour deleted successfully");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete tour");
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
          <Text style={styles.title}>Plant Tours</Text>
          <Text style={styles.subtitle}>
            {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateTour}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: "all", label: "All Tours", count: filteredTours.length },
          { key: "my", label: "My Tours", count: myTours?.length || 0 },
          { key: "public", label: "Public", count: publicTours?.length || 0 },
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

      {/* Tours List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {publicTours === undefined || myTours === undefined ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tours...</Text>
          </View>
        ) : filteredTours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trail-sign-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No tours yet</Text>
            <Text style={styles.emptyText}>
              Create your first plant tour to guide others through interesting plant discoveries
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateTour}>
              <Ionicons name="add" size={20} color="#22C55E" />
              <Text style={styles.emptyButtonText}>Create First Tour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.toursList}>
            {filteredTours.map((tour) => (
              <TouchableOpacity
                key={tour._id}
                style={styles.tourCard}
                onPress={() => handleTourPress(tour._id)}
              >
                <View style={styles.tourHeader}>
                  <View style={styles.tourInfo}>
                    <Text style={styles.tourName}>{tour.name}</Text>
                    <Text style={styles.tourDescription} numberOfLines={2}>
                      {tour.description}
                    </Text>
                  </View>
                  
                  <View style={styles.tourBadges}>
                    {tour.isPublic && (
                      <View style={styles.publicBadge}>
                        <Ionicons name="globe" size={12} color="#3B82F6" />
                        <Text style={styles.publicBadgeText}>Public</Text>
                      </View>
                    )}
                    
                    {demoUser && tour.userId === demoUser._id && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTour(tour._id, tour.name)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.tourMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{tour.stopCount || 0} stops</Text>
                  </View>
                  
                  {tour.estimatedDuration && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.metaText}>{tour.estimatedDuration} min</Text>
                    </View>
                  )}
                  
                  {tour.difficulty && (
                    <View style={styles.metaItem}>
                      <Ionicons 
                        name={tour.difficulty === "easy" ? "walk" : tour.difficulty === "moderate" ? "bicycle" : "fitness"} 
                        size={16} 
                        color="#6B7280" 
                      />
                      <Text style={styles.metaText}>{tour.difficulty}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.tourFooter}>
                  <Text style={styles.tourDate}>
                    Created {new Date(tour._creationTime).toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
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
    paddingHorizontal: 20,
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
  toursList: {
    paddingVertical: 16,
    gap: 16,
  },
  tourCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tourHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tourInfo: {
    flex: 1,
    marginRight: 12,
  },
  tourName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  tourDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  tourBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  publicBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3B82F6",
  },
  deleteButton: {
    padding: 4,
  },
  tourMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tourFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  tourDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});