/**
 * NOTE: only available between `enter` and `exit`
 */
export function getPatternTree(node) {
  return node.stack.specialNodes.patternTree;
}

