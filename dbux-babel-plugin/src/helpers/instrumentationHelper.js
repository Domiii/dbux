/**
 * If true, given node was injected/instrumented by babel or some plugin,
 * meaning it does not exist in original source code and (usually) does not deserve further analysis.
 */
export function isNodeInstrumented(node) {
  return !node.loc;
}

export function isPathInstrumented(path) {
  return !path.node?.loc;
}

export function getPathContextId(path) {
  return path.getData('staticId');
}