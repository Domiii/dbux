import { getScopeBlockPathInstrument } from '../helpers/scopeHelpers';

/**
 * Hackfix: store all nodes to be hoisted, and finally add them all in order, to keep order of execution.
 */
const hoistedNodesByBlock = new Map();

/**
 * 1. Get scope block of targetPath.
 * 2. Add newNodes to the beginning of that block.
 * 
 * NOTE: This will not actually do the hoisting. But it will ensure it will be hoisted when {@link finishAllScopeBlocks} is called.
 * 
 * @param {boolean} append Set to `false` if outer/later nodes should go first.
 */
export function unshiftScopeBlock(targetPath, newNodes, append = true) {
  const scopeBlockPath = getScopeBlockPathInstrument(targetPath);
  let nodes = hoistedNodesByBlock.get(scopeBlockPath);
  if (!nodes) {
    hoistedNodesByBlock.set(scopeBlockPath, nodes = []);
  }
  if (append) {
    nodes.push(...newNodes);
  }
  else {
    nodes.unshift(...newNodes);
  }
  // return scopeBlockPath.unshiftContainer("body", newNodes);
}

export function moveScopeBlock(oldPath, newPath) {
  oldPath = getScopeBlockPathInstrument(oldPath);
  newPath = getScopeBlockPathInstrument(newPath);
  
  const nodes = hoistedNodesByBlock.get(oldPath);
  hoistedNodesByBlock.delete(oldPath);
  hoistedNodesByBlock.set(newPath, nodes);
}


/**
 * 1. Get scope block of targetPath.
 * 2. Add newNodes to the end of that block.
 */
export function pushScopeBlock(targetPath, newNodes) {
  const scopeBlockPath = getScopeBlockPathInstrument(targetPath);
  return scopeBlockPath.pushContainer("body", newNodes);
}

export function finishAllScopeBlocks() {
  for (const [scopeBlockPath, nodes] of hoistedNodesByBlock) {
    scopeBlockPath.unshiftContainer("body", nodes);
  }
  hoistedNodesByBlock.clear();
}
