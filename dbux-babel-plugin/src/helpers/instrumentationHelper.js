export function isPathInstrumented(path) {
  return !path.node.loc;
}

export function getPathTraceId(path) {
  return path.getData('_traceId');
}