import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getMapComponents, defaultMapRegion, isMapAvailable } from "../../utils/mapUtils";
import WebMapView from "../../components/WebMapView";

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "identified" | "pending">("all");
  const mapRef = useRef<any>(null);
  
  // Get map components safely
  const { MapView, Marker, Callout, PROVIDER_GOOGLE, isAvailable: mapAvailable } = getMapComponents();
  
  // Get or create demo user
  const demoUser = useQuery(api.users.getUserByEmail, { email: "demo@plantmapper.com" });
  const createUser = useMutation(api.users.createUser);
  
  // Get user's sightings for the map (only if we have a user)
  const sightings = useQuery(
    api.plantSightings.getUserSightings, 
    demoUser ? { userId: demoUser._id } : "skip"
  );

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

  const filteredSightings = sightings?.filter(sighting => {
    if (selectedFilter === "all") return true;
    return sighting.identificationStatus === selectedFilter;
  }) || [];

  const handleAddSighting = () => {
    router.push("/camera");
  };

  const handleSightingPress = (sightingId: string) => {
    router.push(`/sighting/${sightingId}`);
  };

  const handleMarkerPress = (sighting: any) => {
    // Center map on selected marker
    if (mapRef.current && mapAvailable) {
      mapRef.current.animateToRegion({
        latitude: sighting.location.latitude,
        longitude: sighting.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const fitToMarkers = () => {
    if (mapRef.current && filteredSightings.length > 0 && mapAvailable) {
      mapRef.current.fitToCoordinates(
        filteredSightings.map(s => ({
          latitude: s.location.latitude,
          longitude: s.location.longitude,
        })),
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  };

  // If on web or maps not available, show web-friendly version
  if (!mapAvailable || Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Plant Map</Text>
            <Text style={styles.subtitle}>
              {filteredSightings.length} sighting{filteredSightings.length !== 1 ? 's' : ''} found
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

        {/* Web Map View */}
        <WebMapView 
          sightings={filteredSightings}
          onSightingPress={handleSightingPress}
          onAddSighting={handleAddSighting}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Plant Map</Text>
          <Text style={styles.subtitle}>
            {filteredSightings.length} sighting{filteredSightings.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        <View style={styles.headerButtons}>
          {filteredSightings.length > 1 && mapAvailable && (
            <TouchableOpacity style={styles.fitButton} onPress={fitToMarkers}>
              <Ionicons name="scan" size={20} color="#22C55E" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAddSighting}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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

      {/* Interactive Map */}
      <View style={styles.mapContainer}>
        {MapView && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={defaultMapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            mapType="hybrid"
          >
            {filteredSightings.map((sighting) => (
              <Marker
                key={sighting._id}
                coordinate={{
                  latitude: sighting.location.latitude,
                  longitude: sighting.location.longitude,
                }}
                onPress={() => handleMarkerPress(sighting)}
              >
                <View style={[
                  styles.markerContainer,
                  sighting.identificationStatus === "identified" && styles.markerIdentified,
                  sighting.identificationStatus === "pending" && styles.markerPending,
                  sighting.identificationStatus === "failed" && styles.markerFailed,
                ]}>
                  <Ionicons 
                    name="leaf" 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
                
                {Callout && (
                  <Callout 
                    style={styles.callout}
                    onPress={() => handleSightingPress(sighting._id)}
                  >
                    <View style={styles.calloutContent}>
                      <View style={styles.calloutHeader}>
                        <Text style={styles.calloutTitle}>
                          {sighting.plantProfile?.commonNames[0] || 
                           sighting.userProvidedName || 
                           "Unknown Plant"}
                        </Text>
                        <View style={styles.calloutBadges}>
                          {sighting.plantProfile?.description && (
                            <View style={styles.calloutAiBadge}>
                              <Ionicons name="sparkles" size={10} color="#8B5CF6" />
                            </View>
                          )}
                          <View style={[
                            styles.calloutStatusBadge,
                            sighting.identificationStatus === "identified" && styles.statusIdentified,
                            sighting.identificationStatus === "pending" && styles.statusPending,
                            sighting.identificationStatus === "failed" && styles.statusFailed,
                          ]}>
                            <Text style={[
                              styles.calloutStatusText,
                              sighting.identificationStatus === "identified" && styles.statusTextIdentified,
                            ]}>
                              {sighting.identificationStatus === "identified" ? "✓" : 
                               sighting.identificationStatus === "pending" ? "..." : "!"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      {sighting.plantProfile?.scientificName && (
                        <Text style={styles.calloutScientific}>
                          {sighting.plantProfile.scientificName}
                        </Text>
                      )}
                      
                      <Text style={styles.calloutLocation}>
                        {sighting.location.address || 
                         `${sighting.location.latitude.toFixed(4)}, ${sighting.location.longitude.toFixed(4)}`}
                      </Text>
                      
                      <Text style={styles.calloutDate}>
                        {new Date(sighting._creationTime).toLocaleDateString()}
                      </Text>
                      
                      <Text style={styles.calloutTap}>Tap for details →</Text>
                    </View>
                  </Callout>
                )}
              </Marker>
            ))}
          </MapView>
        )}

        {/* Map overlay for empty state */}
        {filteredSightings.length === 0 && (
          <View style={styles.mapOverlay}>
            <View style={styles.emptyMapContainer}>
              <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyMapTitle}>No plant sightings yet</Text>
              <Text style={styles.emptyMapText}>
                Start by taking a photo of a plant to see it on the map
              </Text>
              <TouchableOpacity style={styles.emptyMapButton} onPress={handleAddSighting}>
                <Ionicons name="camera" size={20} color="#22C55E" />
                <Text style={styles.emptyMapButtonText}>Add First Sighting</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sightings List */}
      <View style={styles.sightingsContainer}>
        <Text style={styles.sectionTitle}>Recent Sightings</Text>
        
        {sightings === undefined ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading sightings...</Text>
          </View>
        ) : filteredSightings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
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
          <ScrollView style={styles.sightingsList} showsVerticalScrollIndicator={false}>
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
                    {sighting.location.address || 
                     `${sighting.location.latitude.toFixed(4)}, ${sighting.location.longitude.toFixed(4)}`}
                  </Text>
                  
                  <Text style={styles.sightingDate}>
                    {new Date(sighting._creationTime).toLocaleDateString()}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fitButton: {
    backgroundColor: "#F3F4F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#22C55E",
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
  mapContainer: {
    height: height * 0.4, // 40% of screen height
    margin: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMapContainer: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyMapTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyMapText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyMapButton: {
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
  emptyMapButtonText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "600",
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIdentified: {
    backgroundColor: "#22C55E",
  },
  markerPending: {
    backgroundColor: "#F59E0B",
  },
  markerFailed: {
    backgroundColor: "#EF4444",
  },
  callout: {
    width: 250,
    minHeight: 120,
  },
  calloutContent: {
    padding: 12,
    gap: 6,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  calloutBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calloutAiBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  calloutStatusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  calloutStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
  },
  calloutScientific: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#6B7280",
  },
  calloutLocation: {
    fontSize: 12,
    color: "#6B7280",
  },
  calloutDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  calloutTap: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  sightingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
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
    flex: 1,
  },
  sightingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  webMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    gap: 16,
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
  },
  webMapText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  webMapSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});