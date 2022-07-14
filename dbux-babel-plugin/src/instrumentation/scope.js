import { newLogger } from '@dbux/common/src/log/logger';
import { astNodeToString, pathToString } from '../helpers/pathHelpers';
import { getScopeBlockPathInstrument } from '../helpers/scopeHelpers';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('inst-scope');

// const Verbose = 2;
const Verbose = 2;

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

  Verbose && debug(`unshiftScopeBlock @"${pathToString(targetPath)}": ${newNodes.map(n => astNodeToString(n)).join(', ')}`);
  // return scopeBlockPath.unshiftContainer("body", newNodes);
}

export function moveScopeBlock(oldPath, newPath) {
  // oldPath = getScopeBlockPathInstrument(oldPath);
  newPath = getScopeBlockPathInstrument(newPath);
  
  const nodes = hoistedNodesByBlock.get(oldPath);
  hoistedNodesByBlock.delete(oldPath);
  hoistedNodesByBlock.set(newPath, nodes);

  Verbose && debug(`moveScopeBlock "${pathToString(oldPath)}" to "${pathToString(newPath)}"`);
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
