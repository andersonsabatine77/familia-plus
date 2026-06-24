const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// --- Compatibilidade com o Firebase JS SDK no React Native ---
// O Firebase publica build .cjs e usa o campo "exports"; o Metro precisa
// reconhecer .cjs e usar a resolução clássica (senão dá o erro
// "Component auth/firestore has not been registered yet" em runtime).
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
