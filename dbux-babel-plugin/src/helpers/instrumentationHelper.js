export function isPathInstrumented(path) {
  return !path.node.loc;
}

export function getPathContextId(path) {
  return path.getData('staticId');
}