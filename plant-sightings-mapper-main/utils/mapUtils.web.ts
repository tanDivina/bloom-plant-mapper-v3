// Web-specific map utilities: never import react-native-maps on web

export const getMapComponents = () => {
  // Return null components on web to avoid bundling native modules
  return {
    MapView: null,
    Marker: null,
    Callout: null,
    PROVIDER_GOOGLE: null,
    isAvailable: false,
  } as const;
};

// Map configuration (used by both web and native UIs)
export const defaultMapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Web-safe map utilities
export const isMapAvailable = () => false;

export const getMapProvider = () => null;