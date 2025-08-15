import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Sighting {
  _id: string;
  plantProfile?: {
    commonNames: string[];
    scientificName?: string;
  } | null; // allow null from backend
  userProvidedName?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  identificationStatus: "identified" | "pending" | "failed";
  _creationTime: number;
}

interface WebMapViewProps {
  sightings: Sighting[];
  onSightingPress: (sightingId: string) => void;
  onAddSighting: () => void;
}

export default function WebMapView({ sightings, onSightingPress, onAddSighting }: WebMapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={48} color="#22C55E" />
        <Text style={styles.title}>Interactive Map</Text>
        <Text style={styles.subtitle}>
          Map view is available on mobile devices
        </Text>
        <Text style={styles.count}>
          {sightings.length} sighting{sightings.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      {sightings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No plant sightings yet</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddSighting}>
            <Ionicons name="camera" size={16} color="#22C55E" />
            <Text style={styles.addButtonText}>Add First Sighting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.sightingsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Plant Locations</Text>
          {sightings.map((sighting) => (
            <TouchableOpacity
              key={sighting._id}
              style={styles.sightingCard}
              onPress={() => onSightingPress(sighting._id)}
            >
              <View style={styles.sightingInfo}>
                <View style={styles.sightingHeader}>
                  <Text style={styles.sightingName}>
                    {sighting.plantProfile?.commonNames[0] || 
                     sighting.userProvidedName || 
                     "Unknown Plant"}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    sighting.identificationStatus === "identified" && styles.statusIdentified,
                    sighting.identificationStatus === "pending" && styles.statusPending,
                    sighting.identificationStatus === "failed" && styles.statusFailed,
                  ]}>
                    <Text style={styles.statusText}>
                      {sighting.identificationStatus === "identified" ? "✓" : 
                       sighting.identificationStatus === "pending" ? "..." : "!"}
                    </Text>
                  </View>
                </View>
                
                {sighting.plantProfile?.scientificName && (
                  <Text style={styles.scientificName}>
                    {sighting.plantProfile.scientificName}
                  </Text>
                )}
                
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.locationText}>
                    {sighting.location.address || 
                     `${sighting.location.latitude.toFixed(4)}, ${sighting.location.longitude.toFixed(4)}`}
                  </Text>
                </View>
                
                <Text style={styles.dateText}>
                  {new Date(sighting._creationTime).toLocaleDateString()}
                </Text>
              </View>
              
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  count: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "500",
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  addButtonText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  sightingsList: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
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
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});