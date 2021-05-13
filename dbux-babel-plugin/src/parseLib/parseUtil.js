
export const DbuxNodeId = '_dbux_node_';

export function getChildPaths(path, nodeNames) {
  return nodeNames.map(name => path.get(name));
}

export function getNodeOfPath(path) {
  return path.getData(DbuxNodeId);
}

export function setNodeOfPath(path, node) {
  return path.setData(DbuxNodeId, node);
}