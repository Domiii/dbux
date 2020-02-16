export function isPathInstrumented(path) {
  return !path.node.loc;
}

export function getPathContextId(path) {
  return path.getData('staticId');
}

export function getPathTraceId(path) {
  return path.getData('_traceId');
}