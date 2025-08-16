import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { isWeb } from "../utils/platform";

type AppStep = "photo" | "identification" | "processing";
type IdentificationMethod = "manual" | "ai" | null;

export default function CameraScreen() {
  const [currentStep, setCurrentStep] = useState<AppStep>("photo");
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [identificationMethod, setIdentificationMethod] = useState<IdentificationMethod>(null);
  const [plantName, setPlantName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [processingStep, setProcessingStep] = useState("");
 
   // Focus handle for manual name entry
   const nameInputRef = useRef<any>(null);
   // Scroll handle to reveal inputs/actions after selecting a method
   const scrollRef = useRef<ScrollView | null>(null);
  
  // Get demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  
  const generateUploadUrl = useMutation(api.plantSightings.generateUploadUrl);
  const createSighting = useMutation(api.plantSightings.createSighting);
  const createUser = useMutation(api.users.createUser);
  const identifyByName = useAction(api.plantIdentification.identifyPlantByName);
  const identifyByPhoto = useAction(api.plantIdentification.identifyPlantByPhoto);

  // Create demo user if it doesn't exist
  const handleCreateDemoUser = async () => {
    if (demoUser === null) {
      await createUser({
        email: "demo@plantmapper.com",
        name: "Plant Explorer"
      });
    }
  };

  // Auto-create demo user when not present
  useEffect(() => {
    if (demoUser === null) {
      handleCreateDemoUser();
    }
  }, [demoUser]);

  const handleTakePhoto = async () => {
    try {
      if (!isWeb) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera access is required to take photos of plants.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setCurrentStep("identification");
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      if (!isWeb) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library access is required to select plant photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setCurrentStep("identification");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const handleManualIdentification = async () => {
    if (!plantName.trim()) {
      Alert.alert("Missing Information", "Please enter a plant name.");
      return;
    }

    if (!selectedImage || !demoUser) {
      Alert.alert("Error", "Missing photo or user information.");
      return;
    }

    await processWithIdentification("manual");
  };

  const handleAIIdentification = async () => {
    if (!selectedImage || !demoUser) {
      Alert.alert("Error", "Missing photo or user information.");
      return;
    }

    await processWithIdentification("ai");
  };

  const processWithIdentification = async (method: "manual" | "ai") => {
    if (!selectedImage || !demoUser) return;

    try {
      setCurrentStep("processing");
      setIsProcessing(true);
      setProcessingStep("Getting location...");

      // Get current location
      const location = await getCurrentLocation();

      setProcessingStep("Uploading photo...");

      // Upload image to Convex storage
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResponse.json();

      // Create sighting record
      const sightingId = await createSighting({
        userId: demoUser._id,
        photoId: storageId,
        location,
      });

      if (method === "manual") {
        setProcessingStep("Identifying plant with AI...");
        
        // Identify plant by name using Gemini
        const identificationResult = await identifyByName({
          sightingId,
          plantName: plantName.trim(),
        });

        setIsProcessing(false);

        if (identificationResult.success) {
          Alert.alert(
            "Plant Identified! 🌱",
            `Successfully identified: ${identificationResult.plantProfile?.commonNames[0] || plantName}`,
            [
              {
                text: "View Details",
                onPress: () => router.replace(`/sighting/${sightingId}`),
              },
              {
                text: "Back to Map",
                onPress: () => router.back(),
              },
            ]
          );
        } else if (identificationResult.suggestions && identificationResult.suggestions.length > 0) {
          // Show suggestions for typos/unclear names
          setSuggestions(identificationResult.suggestions);
          setCurrentStep("identification");
          setProcessingStep("");
        } else {
          Alert.alert(
            "Identification Failed",
            identificationResult.error || "Could not identify this plant name. Please check spelling or try a different name.",
            [
              {
                text: "Try Again",
                onPress: () => {
                  setCurrentStep("identification");
                  setPlantName("");
                  setSuggestions([]);
                },
              },
              {
                text: "Add Manually",
                onPress: () => router.replace(`/sighting/${sightingId}`),
              },
            ]
          );
        }
      } else {
        setProcessingStep("Identifying plant with AI...");
        
        // Identify plant by photo (PlantNet priority, Gemini fallback)
        const identificationResult = await identifyByPhoto({
          sightingId,
          storageId,
        });

        setIsProcessing(false);

        if (identificationResult.success) {
          const methodText = identificationResult.method === "plantnet" ? "PlantNet" : "Gemini AI";
          Alert.alert(
            "Plant Identified! 🌱",
            `${methodText} identified: ${identificationResult.plantProfile?.commonNames[0] || "Unknown"}\n\nScientific name: ${identificationResult.plantProfile?.scientificName || "Not available"}`,
            [
              {
                text: "View Details",
                onPress: () => router.replace(`/sighting/${sightingId}`),
              },
              {
                text: "Back to Map",
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert(
            "Identification Failed",
            identificationResult.error || "Could not identify this plant automatically. You can add details manually.",
            [
              {
                text: "Add Details",
                onPress: () => router.replace(`/sighting/${sightingId}`),
              },
              {
                text: "Try Manual Entry",
                onPress: () => {
                  setCurrentStep("identification");
                  setIdentificationMethod("manual");
                },
              },
              {
                text: "Back to Map",
                onPress: () => router.back(),
              },
            ]
          );
        }
      }

    } catch (error) {
      console.error("Processing error:", error);
      setIsProcessing(false);
      setCurrentStep("identification");
      Alert.alert("Error", "Failed to process image. Please try again.");
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setPlantName(suggestion);
    setSuggestions([]);
  };

  const handleRetakePhoto = () => {
    setSelectedImage(null);
    setCurrentStep("photo");
    setIdentificationMethod(null);
    setPlantName("");
    setSuggestions([]);
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    let location = {
      latitude: 37.7749,
      longitude: -122.4194,
      address: "San Francisco, CA",
    };

    if (status === "granted") {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (address[0]) {
          const addressParts = [];
          if (address[0].street) addressParts.push(address[0].street);
          if (address[0].city) addressParts.push(address[0].city);
          if (address[0].region) addressParts.push(address[0].region);
          
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address: addressParts.length > 0 ? 
              addressParts.join(", ") :
              `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`,
          };
        } else {
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address: `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`,
          };
        }
      } catch (locationError) {
        console.log("Location error:", locationError);
      }
    }

    return location;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Plant Sighting</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === "processing" ? (
          <View style={styles.processingContainer}>
            <View style={styles.processingIcon}>
              <Ionicons name="leaf" size={48} color="#22C55E" />
            </View>
            <Text style={styles.processingTitle}>Processing...</Text>
            <Text style={styles.processingText}>{processingStep}</Text>
          </View>
        ) : currentStep === "photo" ? (
          <>
            {/* Photo Capture Step */}
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionIcon}>
                <Ionicons name="camera" size={48} color="#22C55E" />
              </View>
              <Text style={styles.instructionsTitle}>Capture Plant Photo</Text>
              <Text style={styles.instructionsText}>
                Take a clear photo of the plant you want to identify
              </Text>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleChooseFromLibrary}>
                <Ionicons name="images" size={24} color="#22C55E" />
                <Text style={styles.secondaryButtonText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>📸 Photography Tips</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Focus on leaves, flowers, or distinctive features</Text>
                <Text style={styles.tipItem}>• Ensure good lighting (natural light works best)</Text>
                <Text style={styles.tipItem}>• Get close enough to see details clearly</Text>
                <Text style={styles.tipItem}>• Avoid blurry or dark photos</Text>
              </View>
            </View>

          </>
        ) : currentStep === "identification" ? (
          <>
            {/* Photo Preview */}
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: selectedImage?.uri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
                <Ionicons name="camera" size={16} color="#6B7280" />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Identification Method Selection */}
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionIcon}>
                <Ionicons name="search" size={48} color="#22C55E" />
              </View>
              <Text style={styles.instructionsTitle}>How would you like to identify this plant?</Text>
              <Text style={styles.instructionsText}>
                Choose your preferred method for plant identification
              </Text>
            </View>

            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                disabled={isProcessing}
                onPress={() => {
                  console.log("[Camera] Manual method pressed");
                  if (!isWeb) Haptics.selectionAsync?.();
                  setIdentificationMethod("manual");
                  // Focus and scroll to reveal the input immediately
                  setTimeout(() => {
                    nameInputRef.current?.focus?.();
                    scrollRef.current?.scrollToEnd?.({ animated: true });
                  }, 0);
                }}
              >
                <Ionicons name="create" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Enter Plant Name</Text>
                <Text style={styles.buttonSubtext}>I know what this plant is</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={isProcessing}
                onPress={() => {
                  console.log("[Camera] AI method pressed");
                  if (!isWeb) Haptics.selectionAsync?.();
                  setIdentificationMethod("ai");
                  // Reveal AI section so the "Start AI Identification" button is visible
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd?.({ animated: true });
                  }, 0);
                }}
              >
                <Ionicons name="sparkles" size={24} color="#22C55E" />
                <Text style={styles.secondaryButtonText}>Use AI Identification</Text>
                <Text style={styles.buttonSubtext}>Let AI identify it for me</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Entry Form */}
            {identificationMethod === "manual" && (
              <View style={styles.manualEntryContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={plantName}
                    onChangeText={setPlantName}
                    placeholder="e.g., Rose, Oak Tree, Monstera deliciosa"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.identifyButton, !plantName.trim() && styles.identifyButtonDisabled]}
                    onPress={handleManualIdentification}
                    disabled={!plantName.trim()}
                  >
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                    <Text style={styles.identifyButtonText}>Identify Plant</Text>
                  </TouchableOpacity>
                </View>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Did you mean one of these?</Text>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                      >
                        <Ionicons name="leaf" size={16} color="#22C55E" />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* AI Identification */}
            {identificationMethod === "ai" && (
              <View style={styles.aiIdentificationContainer}>
                <TouchableOpacity
                  style={styles.aiButton}
                  disabled={isProcessing}
                  onPress={handleAIIdentification}
                >
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                  <Text style={styles.aiButtonText}>Start AI Identification</Text>
                  <Text style={styles.aiButtonSubtext}>Using PlantNet & Gemini AI</Text>
                </TouchableOpacity>

                <View style={styles.aiInfoContainer}>
                  <Text style={styles.aiInfoTitle}>🤖 AI Identification Process</Text>
                  <View style={styles.aiSteps}>
                    <Text style={styles.aiStep}>1. PlantNet analyzes your photo</Text>
                    <Text style={styles.aiStep}>2. Gemini enhances with detailed information</Text>
                    <Text style={styles.aiStep}>3. Complete plant profile is created</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Photo Preview */}
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: selectedImage?.uri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
                <Ionicons name="camera" size={16} color="#6B7280" />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Identification Method Selection */}
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionIcon}>
                <Ionicons name="search" size={48} color="#22C55E" />
              </View>
              <Text style={styles.instructionsTitle}>How would you like to identify this plant?</Text>
              <Text style={styles.instructionsText}>
                Choose your preferred method for plant identification
              </Text>
            </View>

            <View style={styles.methodContainer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => setIdentificationMethod("manual")}
              >
                <Ionicons name="create" size={24} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Enter Plant Name</Text>
                <Text style={styles.buttonSubtext}>I know what this plant is</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => setIdentificationMethod("ai")}
              >
                <Ionicons name="sparkles" size={24} color="#22C55E" />
                <Text style={styles.secondaryButtonText}>Use AI Identification</Text>
                <Text style={styles.buttonSubtext}>Let AI identify it for me</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Entry Form */}
            {identificationMethod === "manual" && (
              <View style={styles.manualEntryContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={nameInputRef}
                    style={styles.textInput}
                    value={plantName}
                    onChangeText={setPlantName}
                    placeholder="e.g., Rose, Oak Tree, Monstera deliciosa"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={handleManualIdentification}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.identifyButton, !plantName.trim() && styles.identifyButtonDisabled]}
                    onPress={handleManualIdentification}
                    disabled={!plantName.trim()}
                  >
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                    <Text style={styles.identifyButtonText}>Identify Plant</Text>
                  </TouchableOpacity>
                </View>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Did you mean one of these?</Text>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(suggestion)}
                      >
                        <Ionicons name="leaf" size={16} color="#22C55E" />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* AI Identification */}
            {identificationMethod === "ai" && (
              <View style={styles.aiIdentificationContainer}>
                <TouchableOpacity 
                  style={styles.aiButton}
                  onPress={handleAIIdentification}
                >
                  <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                  <Text style={styles.aiButtonText}>Start AI Identification</Text>
                  <Text style={styles.aiButtonSubtext}>Using PlantNet & Gemini AI</Text>
                </TouchableOpacity>

                <View style={styles.aiInfoContainer}>
                  <Text style={styles.aiInfoTitle}>🤖 AI Identification Process</Text>
                  <View style={styles.aiSteps}>
                    <Text style={styles.aiStep}>1. PlantNet analyzes your photo</Text>
                    <Text style={styles.aiStep}>2. Gemini enhances with detailed information</Text>
                    <Text style={styles.aiStep}>3. Complete plant profile is created</Text>
                  </View>
                </View>
              </View>
            )}
          </>
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 100,
  },
  processingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  processingText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  retakeText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  instructionsContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  instructionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  instructionsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  methodContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#22C55E",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "600",
  },
  manualEntryContainer: {
    marginTop: 24,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  identifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  identifyButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  identifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: "#374151",
  },
  aiIdentificationContainer: {
    marginTop: 24,
    gap: 20,
  },
  aiButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 20,
    borderRadius: 12,
    gap: 8,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  aiButtonSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  aiInfoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aiInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  aiSteps: {
    gap: 6,
  },
  aiStep: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});