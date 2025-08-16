import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const [selectedCategory, setSelectedCategory] = useState("featured");

  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  // Get featured content
  const featuredPlants = useQuery(api.plantProfiles.getAllPlants);
  const recentSightings = useQuery(
    api.plantSightings.getUserSightings,
    demoUser ? { userId: demoUser._id } : "skip"
  );

  // Dev seeding action
  const createSampleData = useMutation(api.sampleData.createSampleData);
  const handleSeed = async () => {
    try {
      await createSampleData({});
    } catch (e) {
      console.log("Seed error:", e);
    }
  };

  const categories = [
    { key: "featured", label: "Featured", icon: "star" },
    { key: "recent", label: "Recent", icon: "time" },
    { key: "nearby", label: "Nearby", icon: "location" },
    { key: "seasonal", label: "Seasonal", icon: "leaf" },
  ];

  const featuredContent = [
    {
      id: "1",
      title: "Native Plants Guide",
      subtitle: "Discover local flora in your area",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=600&fit=crop",
      type: "guide"
    },
    {
      id: "2", 
      title: "Plant Identification Tips",
      subtitle: "Learn how to identify plants like a botanist",
      source: "PlantMapper Guide",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
      type: "tutorial",
      duration: "5 min read"
    },
    {
      id: "3",
      title: "Community Discoveries",
      subtitle: "Recent plant finds from other users",
      image: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=600&fit=crop",
      type: "community",
      duration: "Updated daily"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Discover Plants</Text>
          <Text style={styles.subtitle}>Explore the world of plants around you</Text>
        </View>
        <View style={styles.headerActions}>
          {__DEV__ && (!featuredPlants || featuredPlants.length === 0) && (
            <TouchableOpacity style={styles.devButton} onPress={handleSeed}>
              <Ionicons name="flask" size={20} color="#FFFFFF" />
              <Text style={styles.devButtonText}>Seed</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#22C55E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              selectedCategory === category.key && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={20} 
              color={selectedCategory === category.key ? "#FFFFFF" : "#6B7280"} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Guides</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredContent.map((item) => (
              <TouchableOpacity key={item.id} style={styles.featuredCard}>
                <ImageBackground 
                  source={{ uri: item.image }} 
                  style={styles.featuredImage}
                  imageStyle={styles.featuredImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.featuredGradient}
                  >
                    <View style={styles.featuredContent}>
                      {item.type === "tutorial" && (
                        <View style={styles.tutorialIcon}>
                          <Ionicons name="book" size={16} color="#FFFFFF" />
                        </View>
                      )}
                      <Text style={styles.featuredTitle}>{item.title}</Text>
                      <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
                      {item.source && (
                        <Text style={styles.featuredSource}>{item.source}</Text>
                      )}
                      {item.duration && (
                        <Text style={styles.featuredDuration}>{item.duration}</Text>
                      )}
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Plants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Plants</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/sightings")}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.plantGrid}>
            {featuredPlants?.slice(0, 2).map((plant) => (
              <TouchableOpacity 
                key={plant._id} 
                style={styles.plantCard}
                onPress={() => router.push(`/plant/${plant._id}`)}
              >
                <View style={styles.plantImageContainer}>
                  <ImageBackground 
                    source={{ uri: plant.imageUrl || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=200&h=200&fit=crop" }} 
                    style={styles.plantImage}
                    imageStyle={styles.plantImageStyle}
                  >
                    <View style={styles.plantTypeIndicator}>
                      <Ionicons name="leaf" size={16} color="#22C55E" />
                    </View>
                  </ImageBackground>
                </View>
                
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName}>{plant.commonNames[0] || plant.scientificName}</Text>
                  <Text style={styles.plantScientific}>{plant.scientificName}</Text>
                  <Text style={styles.plantFamily}>{plant.family}</Text>
                </View>
              </TouchableOpacity>
            )) || (
              <View style={styles.emptyPlants}>
                <Ionicons name="leaf-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No plants discovered yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Your Sightings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Recent Discoveries</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/sightings")}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          {recentSightings?.slice(0, 3).map((sighting) => (
            <TouchableOpacity 
              key={sighting._id} 
              style={styles.sightingCard}
              onPress={() => router.push(`/sighting/${sighting._id}`)}
            >
              <View style={styles.sightingIcon}>
                <Ionicons name="leaf" size={24} color="#22C55E" />
                {/* AI Enhancement Indicator */}
                {sighting.plantProfile?.description && (
                  <View style={styles.aiIndicator}>
                    <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                  </View>
                )}
              </View>
              <View style={styles.sightingInfo}>
                <View style={styles.sightingHeader}>
                  <Text style={styles.sightingName}>
                    {sighting.plantProfile?.commonNames[0] || 
                     sighting.userProvidedName || 
                     "Unknown Plant"}
                  </Text>
                  {sighting.plantProfile?.aiEnhanced && (
                    <View style={styles.enhancedBadge}>
                      <Ionicons name="sparkles" size={10} color="#8B5CF6" />
                      <Text style={styles.enhancedText}>AI</Text>
                    </View>
                  )}
                </View>
                
                {/* AI Description Preview */}
                {sighting.plantProfile?.description && (
                  <Text style={styles.aiPreview} numberOfLines={1}>
                    🤖 {sighting.plantProfile.description}
                  </Text>
                )}
                
                <Text style={styles.sightingLocation}>
                  {sighting.location.address || "Location recorded"}
                </Text>
                <Text style={styles.sightingDate}>
                  {new Date(sighting._creationTime).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )) || (
            <TouchableOpacity 
              style={styles.emptyStateCard}
              onPress={() => router.push("/camera")}
            >
              <Ionicons name="camera" size={32} color="#22C55E" />
              <Text style={styles.emptyStateTitle}>Start Your Plant Journey</Text>
              <Text style={styles.emptyStateText}>Take your first plant photo to begin discovering</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push("/camera")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Identify Plant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push("/create-tour")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#8B5CF6" }]}>
                <Ionicons name="flag" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Create Tour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push("/(tabs)/index")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#F59E0B" }]}>
                <Ionicons name="map" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>View Map</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  categoryContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: "#22C55E",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  seeAllText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "600",
  },
  featuredCard: {
    width: width * 0.7,
    height: 280,
    marginLeft: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  featuredImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  featuredImageStyle: {
    borderRadius: 16,
  },
  featuredGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  featuredContent: {
    gap: 4,
  },
  tutorialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  featuredSource: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  featuredDuration: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  plantGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
  },
  plantCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  plantImageContainer: {
    position: "relative",
  },
  plantImage: {
    height: 160,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 12,
  },
  plantImageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  plantTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantInfo: {
    padding: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 2,
  },
  plantFamily: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyPlants: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  sightingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sightingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    position: "relative",
  },
  aiIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sightingInfo: {
    flex: 1,
  },
  sightingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sightingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
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
  emptyStateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  enhancedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  enhancedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  aiPreview: {
    fontSize: 12,
    color: "#8B5CF6",
    fontStyle: "italic",
    marginBottom: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  devButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});