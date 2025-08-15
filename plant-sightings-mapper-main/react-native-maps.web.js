// Web shim for react-native-maps to prevent bundling native modules on web.
// This file is picked on web by React Native platform resolution before node_modules.

import React from 'react';

const Noop = () => null;

// Named exports expected by libraries that import from 'react-native-maps'
export const MapView = Noop;
export const Marker = Noop;
export const Callout = Noop;
export const Polyline = Noop;
export const PROVIDER_GOOGLE = 'google';

// Default export mirrors the package's default MapView export
export default MapView;