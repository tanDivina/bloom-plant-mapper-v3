import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function SightingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedName, setEditedName] = useState("");

  // Get sighting details
  const sighting = useQuery(api.plantSightings.getSighting, { sightingId: id as Id<"plantSightings"> });
  const updateSighting = useMutation(api.plantSightings.updateSighting);
  const deleteSighting = useMutation(api.plantSightings.deleteSighting);
  const enhancePlantProfile = useAction(api.plantIdentification.enhancePlantProfile);

  // Get photo URL
  const photoUrl = useQuery(api.plantSightings.getPhotoUrl,
    sighting ? { photoId: sighting.photoId } : "skip"
  );

  const handleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(true);
    setEditedNotes(sighting?.privateNotes || "");
    setEditedName(sighting?.userProvidedName || "");
  };

  const handleSave = async () => {
    if (!sighting) return;
 
    try {
      await updateSighting({
        sightingId: sighting._id,
        privateNotes: editedNotes.trim() || undefined,
        userProvidedName: editedName.trim() || undefined,
      });
      setIsEditing(false);
      Alert.alert("Success", "Sighting updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update sighting");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedNotes(sighting?.privateNotes || "");
    setEditedName(sighting?.userProvidedName || "");
  };

  const handleDelete = () => {
    if (!sighting) return;

    Alert.alert(
      "Delete Sighting",
      "Are you sure you want to delete this plant sighting? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSighting({ sightingId: sighting._id });
              router.back();
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

  const handleEnhanceProfile = async () => {
    if (!sighting?.plantProfile) {
      Alert.alert("No Plant Profile", "This sighting doesn't have an identified plant profile to enhance.");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const result = await enhancePlantProfile({
        plantId: sighting.plantProfile._id,
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
    }
  };

  const handleViewPlantProfile = () => {
    if (sighting?.plantProfile) {
      router.push(`/plant/${sighting.plantProfile._id}`);
    }
  };

  if (sighting === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sighting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sighting === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Sighting Not Found</Text>
          <Text style={styles.errorText}>This plant sighting could not be found.</Text>
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
        <Text style={styles.headerTitle}>Plant Sighting</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={isEditing ? handleSave : handleEdit}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "create"} 
            size={24} 
            color={isEditing ? "#22C55E" : "#111827"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image" size={48} color="#9CA3AF" />
              <Text style={styles.photoPlaceholderText}>Loading photo...</Text>
            </View>
          )}
        </View>

        {/* Plant Information */}
        <View style={styles.infoContainer}>
          {/* Plant Name */}
          <View style={styles.nameSection}>
            <View style={styles.nameHeader}>
              <Text style={styles.plantName}>
                {sighting.plantProfile?.commonNames[0] || 
                 sighting.userProvidedName || 
                 "Unknown Plant"}
              </Text>
              
              <View style={styles.statusContainer}>
                {/* AI Enhancement Badge */}
                {sighting.plantProfile?.description && (
                  <TouchableOpacity style={styles.aiBadge} onPress={handleEnhanceProfile}>
                    <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                  </TouchableOpacity>
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
              </View>
            </View>

            {sighting.plantProfile?.scientificName && (
              <Text style={styles.scientificName}>
                {sighting.plantProfile.scientificName}
              </Text>
            )}

            {/* Identification Method */}
            {sighting.identificationMethod && (
              <View style={styles.methodContainer}>
                <Ionicons 
                  name={sighting.identificationMethod === "plantnet" ? "camera" : 
                        sighting.identificationMethod === "gemini" ? "sparkles" : "create"} 
                  size={16} 
                  color="#6B7280" 
                />
                <Text style={styles.methodText}>
                  Identified by {sighting.identificationMethod === "plantnet" ? "PlantNet" : 
                                sighting.identificationMethod === "gemini" ? "Gemini AI" : "Manual Entry"}
                  {sighting.confidenceScore && ` (${Math.round(sighting.confidenceScore * 100)}% confidence)`}
                </Text>
              </View>
            )}
          </View>

          {/* Plant Profile Link */}
          {sighting.plantProfile && (
            <TouchableOpacity style={styles.profileButton} onPress={handleViewPlantProfile}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.profileButtonText}>View Full Plant Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {/* AI Description Preview */}
          {sighting.plantProfile?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>🤖 AI Description</Text>
              <Text style={styles.descriptionText} numberOfLines={3}>
                {sighting.plantProfile.description}
              </Text>
              <TouchableOpacity onPress={handleViewPlantProfile}>
                <Text style={styles.readMoreText}>Read more →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* User Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.sectionTitle}>Personal Notes</Text>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.notesInput}
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Add your personal notes about this plant..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.notesDisplay} onPress={handleEdit}>
                <Text style={styles.notesText}>
                  {sighting.privateNotes || "Tap to add personal notes about this plant..."}
                </Text>
                <Ionicons name="create-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* User Provided Name */}
          {isEditing && (
            <View style={styles.nameEditContainer}>
              <Text style={styles.sectionTitle}>Custom Name</Text>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter a custom name for this plant..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          {/* Location */}
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#EF4444" />
              <View style={styles.locationText}>
                <Text style={styles.locationAddress}>
                  {sighting.location.address || "Address not available"}
                </Text>
                <Text style={styles.locationCoords}>
                  {sighting.location.latitude.toFixed(6)}, {sighting.location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {new Date(sighting._creationTime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {new Date(sighting._creationTime).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {sighting.plantProfile && (
              <TouchableOpacity style={styles.enhanceButton} onPress={handleEnhanceProfile}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                <Text style={styles.enhanceButtonText}>Enhance with AI</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete Sighting</Text>
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
  photoContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  photo: {
    width: "100%",
    height: 300,
  },
  photoPlaceholder: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  nameSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  plantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
  },
  statusTextIdentified: {
    color: "#FFFFFF",
  },
  scientificName: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  methodText: {
    fontSize: 14,
    color: "#6B7280",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  profileButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  descriptionContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  notesContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  editContainer: {
    gap: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 100,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  notesDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notesText: {
    flex: 1,
    fontSize: 16,
    color: "#111827", // Fixed: removed dynamic sighting reference
    lineHeight: 22,
  },
  nameEditContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  locationContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  metadataContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metadataGrid: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: "#6B7280",
  },
  actionsContainer: {
    gap: 12,
  },
  enhanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  enhanceButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});