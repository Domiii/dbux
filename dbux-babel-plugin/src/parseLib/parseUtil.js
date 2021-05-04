
export function getChildPaths(path, nodeNames) {
  return nodeNames.map(name => path.get(name));
}