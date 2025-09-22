const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to the resolver asset extensions to support WebAssembly modules
config.resolver.assetExts.push('wasm');

// Add JPEG extensions to support uppercase JPEG files
config.resolver.assetExts.push('JPEG', 'jpeg');

// Remove 'wasm' from source extensions to prevent parsing as JavaScript
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'wasm');

module.exports = config;