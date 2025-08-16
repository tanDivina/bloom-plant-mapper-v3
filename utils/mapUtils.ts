// Platform-specific map utilities
import { Platform } from 'react-native';

// Safe map component imports with better web handling
export const getMapComponents = () => {
  if (Platform.OS === 'web') {
    // Return null components for web to prevent native imports
    return {
      MapView: null,
      Marker: null,
      Callout: null,
      PROVIDER_GOOGLE: null,
      isAvailable: false,
    };
  }

  // Only import react-native-maps on native platforms
  try {
    // Use dynamic import to prevent bundling on web
    const MapComponents = require('react-native-maps');
    return {
      MapView: MapComponents.default || MapComponents.MapView,
      Marker: MapComponents.Marker,
      Callout: MapComponents.Callout,
      PROVIDER_GOOGLE: MapComponents.PROVIDER_GOOGLE,
      isAvailable: true,
    };
  } catch (error) {
    console.warn('react-native-maps not available:', error);
    return {
      MapView: null,
      Marker: null,
      Callout: null,
      PROVIDER_GOOGLE: null,
      isAvailable: false,
    };
  }
};

// Map configuration
export const defaultMapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Web-safe map utilities
export const isMapAvailable = () => {
  return Platform.OS !== 'web';
};

export const getMapProvider = () => {
  if (Platform.OS === 'web') return null;
  try {
    const MapComponents = require('react-native-maps');
    return MapComponents.PROVIDER_GOOGLE;
  } catch {
    return null;
  }
};