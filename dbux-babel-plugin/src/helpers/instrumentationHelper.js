export function isPathInstrumented(path) {
  return !path.node.loc;
}