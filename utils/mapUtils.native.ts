// Native-specific map utilities: temporarily disable react-native-maps to avoid bundling/runtime errors
// on Expo Go without prebuild. This mirrors the web shim and ensures the app runs on device.
// Later, to enable native maps, remove this file and follow the "Enable native maps" steps below.

export const getMapComponents = () => {
  return {
    MapView: null,
    Marker: null,
    Callout: null,
    PROVIDER_GOOGLE: null,
    isAvailable: false,
  } as const;
};

export const defaultMapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const isMapAvailable = () => false;

export const getMapProvider = () => null;

/*
Enable native maps later (optional):
1) Remove this file: utils/mapUtils.native.ts
2) Ensure react-native-maps version matches Expo SDK (expo install react-native-maps)
3) Prebuild the native project:
   - npx expo prebuild -p ios,android
   - Add Google Maps keys in app.json under ios.config.googleMapsApiKey and android.config.googleMaps.apiKey
4) Rebuild the app:
   - npx expo run:ios or npx expo run:android
*/