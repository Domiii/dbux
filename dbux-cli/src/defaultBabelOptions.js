
export default function buildDefaultBabelOptions(targetPath) {
  // add babelrc roots using some heuristics (used for dev mode dbux runs)
  const babelrcRoots = [];
  if (targetPath) {
    babelrcRoots.push(
      `${targetPath}/..`,
      `${targetPath}/../..`
    );
  }

  return {
    sourceMaps: 'inline',
    presets: [
      "@babel/preset-env"
    ],
    babelrcRoots
  };
}