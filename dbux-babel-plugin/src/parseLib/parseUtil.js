import { newLogger } from '@dbux/common/src/log/logger';

const { debug } = newLogger('parseUtil');

export const DbuxNodeId = '_dbux_node_';

export function getChildPaths(path, childrenNames) {
  // childrenNames.map(name => path.get(name));
  return childrenNames.map(name => {
    const child = path.get(name);
    if (!child.node) {
      return null;
    }
    return child;
  });
}

export function getNodeOfPath(path) {
  return Array.isArray(path) ? path.map(getSingleNodeOfPath) : getSingleNodeOfPath(path);
}

function getSingleNodeOfPath(path) {
  // debug(`getNodeOfPath ${path}`, Object.keys(path.data || {}));
  return path?.getData(DbuxNodeId) || null;
}

export function setNodeOfPath(path, node) {
  path.setData(DbuxNodeId, node);
  // debug(`setNodeOfPath ${path}`, Object.keys(path.data));
}