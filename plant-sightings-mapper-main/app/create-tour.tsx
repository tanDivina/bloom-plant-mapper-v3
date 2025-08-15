import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

type Difficulty = "easy" | "moderate" | "challenging";

export default function CreateTourScreen() {
  const [tourName, setTourName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [selectedSightings, setSelectedSightings] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  // Get user's sightings to add as tour stops
  const userSightings = useQuery(
    api.plantSightings.getUserSightings,
    demoUser ? { userId: demoUser._id } : "skip"
  );

  const createTour = useMutation(api.tours.createTour);
  const addTourStop = useMutation(api.tours.addTourStop);

  const handleSightingToggle = (sightingId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedSightings(prev => 
      prev.includes(sightingId) 
        ? prev.filter(id => id !== sightingId)
        : [...prev, sightingId]
    );
  };

  const handleCreateTour = async () => {
    if (!tourName.trim()) {
      Alert.alert("Missing Information", "Please enter a tour name.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Missing Information", "Please enter a tour description.");
      return;
    }

    if (selectedSightings.length === 0) {
      Alert.alert("No Stops Selected", "Please select at least one plant sighting for your tour.");
      return;
    }

    if (!demoUser) {
      Alert.alert("Error", "User information not available.");
      return;
    }

    try {
      setIsCreating(true);

      // Create the tour
      const tourId = await createTour({
        userId: demoUser._id,
        name: tourName.trim(),
        description: description.trim(),
        isPublic,
        difficulty,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        totalStops: selectedSightings.length,
      });

      // Add tour stops
      for (let i = 0; i < selectedSightings.length; i++) {
        await addTourStop({
          tourId,
          sightingId: selectedSightings[i],
        });
      }

      Alert.alert(
        "Tour Created! 🎉",
        `"${tourName}" has been created with ${selectedSightings.length} stops.`,
        [
          {
            text: "View Tour",
            onPress: () => router.replace(`/tour/${tourId}`),
          },
          {
            text: "Back to Tours",
            onPress: () => router.replace("/(tabs)/tours"),
          },
        ]
      );

    } catch (error) {
      console.error("Tour creation error:", error);
      Alert.alert("Error", "Failed to create tour. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const difficultyOptions: { key: Difficulty; label: string; icon: string; description: string }[] = [
    { key: "easy", label: "Easy", icon: "walk", description: "Suitable for all ages, minimal walking" },
    { key: "moderate", label: "Moderate", icon: "bicycle", description: "Some walking required, moderate terrain" },
    { key: "challenging", label: "Challenging", icon: "fitness", description: "Extensive walking, difficult terrain" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => router.back()}
          disabled={isCreating}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tour</Text>
        <TouchableOpacity 
          style={[styles.createButton, (!tourName.trim() || !description.trim() || selectedSightings.length === 0) && styles.createButtonDisabled]}
          onPress={handleCreateTour}
          disabled={isCreating || !tourName.trim() || !description.trim() || selectedSightings.length === 0}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tour Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tour Name *</Text>
            <TextInput
              style={styles.textInput}
              value={tourName}
              onChangeText={setTourName}
              placeholder="e.g., Downtown Plant Walk, Campus Flora Tour"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what makes this tour special and what visitors will discover..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder="e.g., 30, 60, 120"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <View style={styles.difficultyContainer}>
            {difficultyOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.difficultyOption,
                  difficulty === option.key && styles.difficultyOptionSelected,
                ]}
                onPress={() => setDifficulty(option.key)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={difficulty === option.key ? "#FFFFFF" : "#6B7280"} 
                />
                <Text style={[
                  styles.difficultyLabel,
                  difficulty === option.key && styles.difficultyLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.difficultyDescription,
                  difficulty === option.key && styles.difficultyDescriptionSelected,
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visibility Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <TouchableOpacity 
            style={styles.visibilityOption}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View style={styles.visibilityInfo}>
              <Ionicons 
                name={isPublic ? "globe" : "lock-closed"} 
                size={24} 
                color={isPublic ? "#3B82F6" : "#6B7280"} 
              />
              <View style={styles.visibilityText}>
                <Text style={styles.visibilityLabel}>
                  {isPublic ? "Public Tour" : "Private Tour"}
                </Text>
                <Text style={styles.visibilityDescription}>
                  {isPublic 
                    ? "Anyone can discover and follow this tour"
                    : "Only you can access this tour"
                  }
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, isPublic && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tour Stops Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Tour Stops ({selectedSightings.length} selected)
          </Text>
          
          {userSightings === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your sightings...</Text>
            </View>
          ) : userSightings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Sightings Available</Text>
              <Text style={styles.emptyText}>
                You need to add some plant sightings before creating a tour
              </Text>
              <TouchableOpacity 
                style={styles.addSightingButton} 
                onPress={() => router.push("/camera")}
              >
                <Ionicons name="camera" size={20} color="#22C55E" />
                <Text style={styles.addSightingButtonText}>Add Plant Sighting</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sightingsList}>
              {userSightings.map((sighting) => {
                const isSelected = selectedSightings.includes(sighting._id);
                return (
                  <TouchableOpacity
                    key={sighting._id}
                    style={[styles.sightingItem, isSelected && styles.sightingItemSelected]}
                    onPress={() => handleSightingToggle(sighting._id)}
                  >
                    <View style={styles.sightingInfo}>
                      <Text style={styles.sightingName}>
                        {sighting.plantProfile?.commonNames[0] || 
                         sighting.userProvidedName || 
                         "Unknown Plant"}
                      </Text>
                      
                      {sighting.plantProfile?.scientificName && (
                        <Text style={styles.sightingScientific}>
                          {sighting.plantProfile.scientificName}
                        </Text>
                      )}
                      
                      <Text style={styles.sightingLocation}>
                        📍 {sighting.location.address || 
                         `${sighting.location.latitude.toFixed(4)}, ${sighting.location.longitude.toFixed(4)}`}
                      </Text>
                    </View>
                    
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Tour Preview */}
        {selectedSightings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tour Preview</Text>
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Ionicons name="flag" size={24} color="#22C55E" />
                <Text style={styles.previewTitle}>{tourName || "Your Tour"}</Text>
              </View>
              
              <Text style={styles.previewDescription}>
                {description || "Tour description will appear here"}
              </Text>
              
              <View style={styles.previewMeta}>
                <View style={styles.previewMetaItem}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.previewMetaText}>{selectedSightings.length} stops</Text>
                </View>
                
                {estimatedDuration && (
                  <View style={styles.previewMetaItem}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.previewMetaText}>{estimatedDuration} min</Text>
                  </View>
                )}
                
                <View style={styles.previewMetaItem}>
                  <Ionicons 
                    name={difficulty === "easy" ? "walk" : difficulty === "moderate" ? "bicycle" : "fitness"} 
                    size={16} 
                    color="#6B7280" 
                  />
                  <Text style={styles.previewMetaText}>{difficulty}</Text>
                </View>
              </View>
            </View>
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
  createButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  difficultyContainer: {
    gap: 12,
  },
  difficultyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  difficultyOptionSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#22C55E",
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 12,
    marginBottom: 2,
  },
  difficultyLabelSelected: {
    color: "#FFFFFF",
  },
  difficultyDescription: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
  },
  difficultyDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  visibilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  visibilityText: {
    marginLeft: 12,
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  visibilityDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#22C55E",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  addSightingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 2,
    borderColor: "#22C55E",
    marginTop: 8,
  },
  addSightingButtonText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  sightingsList: {
    gap: 12,
  },
  sightingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  sightingItemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  sightingInfo: {
    flex: 1,
  },
  sightingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  sightingScientific: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 4,
  },
  sightingLocation: {
    fontSize: 14,
    color: "#6B7280",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#22C55E",
  },
  previewContainer: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  previewDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  previewMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});