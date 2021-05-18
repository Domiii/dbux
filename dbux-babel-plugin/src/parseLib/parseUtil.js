export const DbuxNodeId = '_dbux_node_';

export function getChildPaths(path, childrenNames) {
  return childrenNames.map(name => path.get(name));
}

function getSingleNodeOfPath(path) {
  return path.getData(DbuxNodeId);
}

export function getNodeOfPath(path) {
  return Array.isArray(path) ? path.map(getSingleNodeOfPath) : getSingleNodeOfPath(path);
}

export function setNodeOfPath(path, node) {
  return path.setData(DbuxNodeId, node);
}