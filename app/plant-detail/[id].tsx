import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const { width, height } = Dimensions.get('window');

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Get plant profile
  const plantProfile = useQuery(api.plantProfiles.getPlantProfile, { 
    plantId: id as Id<"plantProfiles"> 
  });

  const enhancePlantProfile = useAction(api.plantIdentification.enhancePlantProfile);

  const handleEnhanceProfile = async () => {
    if (!plantProfile) return;

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setIsEnhancing(true);
      await enhancePlantProfile({
        plantProfileId: plantProfile._id,
      });
    } catch (error) {
      console.error("Enhancement error:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "information-circle" },
    { key: "care", label: "Care", icon: "water" },
    { key: "ecology", label: "Ecology", icon: "earth" },
    { key: "culture", label: "Culture", icon: "library" },
  ];

  if (plantProfile === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="leaf" size={48} color="#22C55E" />
          <Text style={styles.loadingText}>Loading plant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (plantProfile === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Plant Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mock hero image - in real app, this would come from the plant data
  const heroImage = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=600&fit=crop";

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <ImageBackground 
        source={{ uri: heroImage }} 
        style={styles.heroSection}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        >
          {/* Header */}
          <SafeAreaView style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="share" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Plant Info */}
          <View style={styles.heroContent}>
            <View style={styles.plantBadges}>
              {plantProfile.aiEnhanced && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                  <Text style={styles.aiBadgeText}>AI Enhanced</Text>
                </View>
              )}
              {plantProfile.family && (
                <View style={styles.familyBadge}>
                  <Text style={styles.familyBadgeText}>{plantProfile.family}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.plantName}>
              {plantProfile.commonNames[0] || "Unknown Plant"}
            </Text>
            
            {plantProfile.scientificName && (
              <Text style={styles.scientificName}>
                {plantProfile.scientificName}
              </Text>
            )}

            <View style={styles.plantMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>Native to tropical regions</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="resize" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>Grows up to 2m tall</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? "#22C55E" : "#6B7280"} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <View style={styles.tabPanel}>
            {/* Description */}
            {plantProfile.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This Plant</Text>
                <Text style={styles.descriptionText}>{plantProfile.description}</Text>
              </View>
            )}

            {/* Detailed Description */}
            {plantProfile.detailedDescription && (
              <View style={styles.section}>
                <View style={styles.aiSectionHeader}>
                  <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                  <Text style={styles.sectionTitle}>Detailed Information</Text>
                </View>
                <Text style={styles.descriptionText}>{plantProfile.detailedDescription}</Text>
              </View>
            )}

            {/* Common Names */}
            {plantProfile.commonNames.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Names</Text>
                <View style={styles.namesList}>
                  {plantProfile.commonNames.map((name, index) => (
                    <View key={index} style={styles.nameTag}>
                      <Text style={styles.nameTagText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Facts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Facts</Text>
              <View style={styles.factsList}>
                <View style={styles.factItem}>
                  <Ionicons name="sunny" size={24} color="#F59E0B" />
                  <View style={styles.factContent}>
                    <Text style={styles.factLabel}>Light Requirements</Text>
                    <Text style={styles.factValue}>
                      {plantProfile.lightRequirements || "Bright, indirect light"}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.factItem}>
                  <Ionicons name="water" size={24} color="#3B82F6" />
                  <View style={styles.factContent}>
                    <Text style={styles.factLabel}>Watering</Text>
                    <Text style={styles.factValue}>
                      {plantProfile.waterNeeds || "Water when soil is dry"}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.factItem}>
                  <Ionicons name="thermometer" size={24} color="#EF4444" />
                  <View style={styles.factContent}>
                    <Text style={styles.factLabel}>Temperature</Text>
                    <Text style={styles.factValue}>18-24°C (65-75°F)</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "care" && (
          <View style={styles.tabPanel}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Care Instructions</Text>
              {plantProfile.careInstructions ? (
                <Text style={styles.descriptionText}>{plantProfile.careInstructions}</Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Detailed care instructions will be available after AI enhancement.
                </Text>
              )}
            </View>

            {/* Growing Conditions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Growing Conditions</Text>
              <View style={styles.conditionsList}>
                <View style={styles.conditionItem}>
                  <Ionicons name="sunny" size={20} color="#F59E0B" />
                  <Text style={styles.conditionLabel}>Light</Text>
                  <Text style={styles.conditionValue}>
                    {plantProfile.lightRequirements || "Bright, indirect"}
                  </Text>
                </View>
                
                <View style={styles.conditionItem}>
                  <Ionicons name="water" size={20} color="#3B82F6" />
                  <Text style={styles.conditionLabel}>Water</Text>
                  <Text style={styles.conditionValue}>
                    {plantProfile.waterNeeds || "Moderate"}
                  </Text>
                </View>
                
                <View style={styles.conditionItem}>
                  <Ionicons name="earth" size={20} color="#8B5A2B" />
                  <Text style={styles.conditionLabel}>Soil</Text>
                  <Text style={styles.conditionValue}>
                    {plantProfile.soilPreferences || "Well-draining"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "ecology" && (
          <View style={styles.tabPanel}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ecological Role</Text>
              {plantProfile.ecologicalRole ? (
                <Text style={styles.descriptionText}>{plantProfile.ecologicalRole}</Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Ecological information will be available after AI enhancement.
                </Text>
              )}
            </View>

            {/* Habitat */}
            {plantProfile.habitat && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Natural Habitat</Text>
                <Text style={styles.descriptionText}>{plantProfile.habitat}</Text>
              </View>
            )}

            {/* Native Regions */}
            {plantProfile.nativeRegions && plantProfile.nativeRegions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Native Regions</Text>
                <View style={styles.regionsList}>
                  {plantProfile.nativeRegions.map((region, index) => (
                    <View key={index} style={styles.regionTag}>
                      <Text style={styles.regionText}>{region}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === "culture" && (
          <View style={styles.tabPanel}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cultural Significance</Text>
              {plantProfile.culturalSignificance ? (
                <Text style={styles.descriptionText}>{plantProfile.culturalSignificance}</Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Cultural information will be available after AI enhancement.
                </Text>
              )}
            </View>

            {/* Conservation Status */}
            {plantProfile.conservationStatus && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conservation Status</Text>
                <View style={styles.conservationContainer}>
                  <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                  <Text style={styles.conservationText}>{plantProfile.conservationStatus}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Enhancement Button */}
        {!plantProfile.aiEnhanced && (
          <View style={styles.enhanceContainer}>
            <TouchableOpacity 
              style={[styles.enhanceButton, isEnhancing && styles.enhanceButtonDisabled]}
              onPress={handleEnhanceProfile}
              disabled={isEnhancing}
            >
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.enhanceButtonText}>
                {isEnhancing ? "Enhancing..." : "Enhance with AI"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.enhanceDescription}>
              Get detailed care instructions, ecological information, and cultural significance
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  heroSection: {
    height: height * 0.5,
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroGradient: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  heroContent: {
    padding: 20,
    paddingBottom: 32,
  },
  plantBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  familyBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  familyBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  plantName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  plantMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 20,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#22C55E",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabPanel: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  aiSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontStyle: "italic",
    lineHeight: 24,
  },
  namesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nameTag: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  nameTagText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "500",
  },
  factsList: {
    gap: 16,
  },
  factItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    gap: 12,
  },
  factContent: {
    flex: 1,
  },
  factLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  factValue: {
    fontSize: 14,
    color: "#6B7280",
  },
  conditionsList: {
    gap: 12,
  },
  conditionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    minWidth: 60,
  },
  conditionValue: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  regionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  regionTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  conservationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
  },
  conservationText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "500",
  },
  enhanceContainer: {
    margin: 20,
    alignItems: "center",
    gap: 12,
  },
  enhanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    gap: 8,
    width: "100%",
  },
  enhanceButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  enhanceButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  enhanceDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#EF4444",
  },
  backButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});