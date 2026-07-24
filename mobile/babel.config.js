module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // reanimated/plugin se agrega solo cuando se use el hook `useSharedValue`
    // — no lo necesitamos en v0.1 (sin animaciones custom con reanimated).
  };
};
