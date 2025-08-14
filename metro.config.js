/**
 * Metro config for Expo (web + native)
 * - Keeps defaults
 * - Adds 'bin' to asset extensions
 * - Forces react-native-maps and react-native-maps-directions to a local shim on all platforms
 *   to prevent importing native-only modules (MapViewNativeComponent, MapMarkerNativeComponent)
 *   when running under Expo Go without a native prebuild.
 */
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');
const { resolve: metroResolve } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

// Ensure additional asset extension
config.resolver.assetExts = [...config.resolver.assetExts, 'bin'];

// Point react-native-maps (and -directions) to our shim everywhere
const shimPath = path.resolve(__dirname, 'react-native-maps.web.js');

// Alias for Metro resolver (newer Metro supports alias)
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native-maps': shimPath,
  'react-native-maps-directions': shimPath,
};

// Also provide extraNodeModules mapping (older Metro / environments)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-maps': shimPath,
  'react-native-maps-directions': shimPath,
};

// Custom resolver to forcibly redirect any subpath imports to the shim as well,
// e.g. "react-native-maps/lib/MapView" → shim
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native-maps' ||
    moduleName.startsWith('react-native-maps/') ||
    moduleName === 'react-native-maps-directions' ||
    moduleName.startsWith('react-native-maps-directions/')
  ) {
    return { type: 'sourceFile', filePath: shimPath };
  }
  return metroResolve(context, moduleName, platform);
};

// Block ONLY react-native-maps native components. Do not block generic NativeModules.
config.resolver.blockList = [
  /react-native-maps\/.*NativeComponent\.js$/,
  /react-native-maps\/.*NativeComponent\.ts$/,
  /react-native-maps\/.*\/MapMarkerNativeComponent/,
  /react-native-maps\/.*\/MapViewNativeComponent/,
  /react-native-maps\/.*\/AirMapMarker/,
  /react-native-maps\/.*\/AirMapCallout/,
  /react-native-maps\/.*\/MapCalloutNativeComponent/,
  /react-native-maps\/.*\/MapCircleNativeComponent/,
  /react-native-maps\/.*\/MapPolygonNativeComponent/,
  /react-native-maps\/.*\/MapPolylineNativeComponent/,
];

module.exports = config;