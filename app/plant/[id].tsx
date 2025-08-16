import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function PlantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      const result = await enhancePlantProfile({
        plantProfileId: plantProfile._id,
      });

      if (result.success) {
        Alert.alert(
          "Profile Enhanced! ✨",
          "The plant profile has been enhanced with detailed AI-generated information.",
          [{ text: "Great!" }]
        );
      } else {
        Alert.alert("Enhancement Failed", result.error || "Could not enhance the plant profile.");
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      Alert.alert("Error", "Failed to enhance plant profile");
    } finally {
      setIsEnhancing(false);
    }
  };

  if (plantProfile === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plant profile...</Text>
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
          <Text style={styles.errorText}>This plant profile could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plant Profile</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleEnhanceProfile}
          disabled={isEnhancing}
        >
          <Ionicons 
            name="sparkles" 
            size={24} 
            color={isEnhancing ? "#9CA3AF" : "#8B5CF6"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plant Header */}
        <View style={styles.plantHeader}>
          <View style={styles.plantIcon}>
            <Ionicons name="leaf" size={48} color="#22C55E" />
          </View>
          
          <Text style={styles.plantName}>
            {plantProfile.commonNames[0] || "Unknown Plant"}
          </Text>
          
          {plantProfile.scientificName && (
            <Text style={styles.scientificName}>
              {plantProfile.scientificName}
            </Text>
          )}

          {plantProfile.family && (
            <View style={styles.familyContainer}>
              <Ionicons name="git-branch" size={16} color="#6B7280" />
              <Text style={styles.familyText}>Family: {plantProfile.family}</Text>
            </View>
          )}

          {/* AI Enhancement Badge */}
          {plantProfile.aiEnhanced && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={styles.aiBadgeText}>AI Enhanced</Text>
            </View>
          )}
        </View>

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

        {/* Description */}
        {plantProfile.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{plantProfile.description}</Text>
          </View>
        )}

        {/* Detailed Description (AI Enhanced) */}
        {plantProfile.detailedDescription && (
          <View style={styles.section}>
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Detailed Information</Text>
            </View>
            <Text style={styles.descriptionText}>{plantProfile.detailedDescription}</Text>
          </View>
        )}

        {/* Care Instructions */}
        {plantProfile.careInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Care Instructions</Text>
            <Text style={styles.descriptionText}>{plantProfile.careInstructions}</Text>
          </View>
        )}

        {/* Growing Conditions */}
        {(plantProfile.lightRequirements || plantProfile.waterNeeds || plantProfile.soilPreferences) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growing Conditions</Text>
            <View style={styles.conditionsGrid}>
              {plantProfile.lightRequirements && (
                <View style={styles.conditionItem}>
                  <Ionicons name="sunny" size={20} color="#F59E0B" />
                  <Text style={styles.conditionLabel}>Light</Text>
                  <Text style={styles.conditionValue}>{plantProfile.lightRequirements}</Text>
                </View>
              )}
              
              {plantProfile.waterNeeds && (
                <View style={styles.conditionItem}>
                  <Ionicons name="water" size={20} color="#3B82F6" />
                  <Text style={styles.conditionLabel}>Water</Text>
                  <Text style={styles.conditionValue}>{plantProfile.waterNeeds}</Text>
                </View>
              )}
              
              {plantProfile.soilPreferences && (
                <View style={styles.conditionItem}>
                  <Ionicons name="earth" size={20} color="#8B5A2B" />
                  <Text style={styles.conditionLabel}>Soil</Text>
                  <Text style={styles.conditionValue}>{plantProfile.soilPreferences}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Ecological Information */}
        {(plantProfile.ecologicalRole || plantProfile.habitat || plantProfile.nativeRegions) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ecological Information</Text>
            
            {plantProfile.ecologicalRole && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ecological Role:</Text>
                <Text style={styles.infoValue}>{plantProfile.ecologicalRole}</Text>
              </View>
            )}
            
            {plantProfile.habitat && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Habitat:</Text>
                <Text style={styles.infoValue}>{plantProfile.habitat}</Text>
              </View>
            )}
            
            {plantProfile.nativeRegions && plantProfile.nativeRegions.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Native Regions:</Text>
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

        {/* Seasonal Information */}
        {(plantProfile.bloomingSeason || plantProfile.seasonalChanges) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seasonal Information</Text>
            
            {plantProfile.bloomingSeason && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Blooming Season:</Text>
                <Text style={styles.infoValue}>{plantProfile.bloomingSeason}</Text>
              </View>
            )}
            
            {plantProfile.seasonalChanges && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Seasonal Changes:</Text>
                <Text style={styles.infoValue}>{plantProfile.seasonalChanges}</Text>
              </View>
            )}
          </View>
        )}

        {/* Cultural Significance */}
        {plantProfile.culturalSignificance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cultural Significance</Text>
            <Text style={styles.descriptionText}>{plantProfile.culturalSignificance}</Text>
          </View>
        )}

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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
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
  plantHeader: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 32,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  plantIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  plantName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 20,
    fontStyle: "italic",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  familyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  familyText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
  conditionsGrid: {
    gap: 16,
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
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  regionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
});