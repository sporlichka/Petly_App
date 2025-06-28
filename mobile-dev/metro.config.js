const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for React Navigation's theming
config.resolver.sourceExts.push('cjs');

module.exports = config; 