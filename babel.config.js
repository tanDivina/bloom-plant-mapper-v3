module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
    env: {
      web: {
        plugins: [
          // Additional web-specific plugins if needed
        ],
      },
    },
  };
};