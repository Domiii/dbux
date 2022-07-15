import { inspect } from 'util';
import { NodePath } from '@babel/traverse';
import { newLogger } from '@dbux/common/src/log/logger';
import { astNodeToString, pathToString } from '../helpers/pathHelpers';
import { getScopeBlockPathInstrument } from '../helpers/scopeHelpers';

/** @typedef { import("@babel/types").Node } AstNode */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('inst-scope');

// const Verbose = 2;
const Verbose = 0;

class BlockEntry {
  /**
   * @type {AstNode[]}
   */
  node;

  /**
   * @type {Function?}
   */
  comparator;
}

/** @typedef { BlockEntry | AstNode } AnyBlockEntry  */

function anyEntryToString(n) {
  if (n.comparator) {
    return astNodeToString(n.node);
  }
  if (n.type) {
    return astNodeToString(n);
  }
  // return JSON.stringify(n) + '';
  // return inspect(n);
  return `[${typeof n}] ${n}`;
}

/**
 * Hackfix: store all nodes to be hoisted, and finally add them all in order, to keep order of execution.
 * @type {Map.<NodePath, Array.<AnyBlockEntry>>}
 */
const hoistedNodesByBlock = new Map();

/**
 * 1. Get scope block of targetPath.
 * 2. Add newNodes to the beginning of that block.
 * 
 * NOTE: This will not actually do the hoisting. But it will ensure it will be hoisted when {@link finishAllScopeBlocks} is called.
 * 
 * @param {AnyBlockEntry[]} newNodes
 * @param {boolean} append Set to `false` if outer/later nodes should go first.
 */
export function addHoistedNodesToScope(targetPath, newNodes, append = true) {
  const scopeBlockPath = getScopeBlockPathInstrument(targetPath);
  addHoistedNodesToPath(scopeBlockPath, newNodes, append);
}

/**
 * @param {AnyBlockEntry[]} newNodes
 * @param {boolean} append Set to `false` if outer/later nodes should go first.
 */
export function addHoistedNodesToPath(targetPath, newNodes, append = true) {
  if (!Array.isArray(newNodes)) {
    throw new Error(`newNodes must be array, but found: ${newNodes}`);
  }
  let entries = hoistedNodesByBlock.get(targetPath);
  if (!entries) {
    hoistedNodesByBlock.set(targetPath, entries = []);
  }
  if (append) {
    entries.push(...newNodes);
  }
  else {
    entries.unshift(...newNodes);
  }

  Verbose && debug(`unshiftScopeBlock @"${pathToString(targetPath)}": ${newNodes.map(n => anyEntryToString(n)).join(', ')}`);
  // return scopeBlockPath.unshiftContainer("body", newNodes);
}

/**
 * hackfix: deal with replaced/moved scopes.
 * 
 * @param {NodePath} oldPath 
 * @param {NodePath} newPath 
 */
export function moveScopeBlock(oldPath, newPath) {
  // oldPath = getScopeBlockPathInstrument(oldPath);
  newPath = getScopeBlockPathInstrument(newPath);

  const nodes = hoistedNodesByBlock.get(oldPath);
  if (nodes) {
    hoistedNodesByBlock.delete(oldPath);
    hoistedNodesByBlock.set(newPath, nodes);
  }

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

/**
 * @param {Array.<AnyBlockEntry>} nodes 
 */
function sortNodes(nodes) {
  nodes.sort((a, b) => {
    if (a.comparator && b.comparator === a.comparator) {
      return a.comparator(a, b);
    }
    return 0; // cannot compare
  });
}

export function finishAllScopeBlocks() {
  for (const [scopeBlockPath, entries] of hoistedNodesByBlock) {
    sortNodes(entries);
    Verbose && debug(`Added ${entries.length} nodes:\n  ${entries.map((n, i) => `${i}) ` + anyEntryToString(n)).join('\n  ')}`);
    const nodes = entries.map(e => e.node || e);
    scopeBlockPath.unshiftContainer("body", nodes);
  }
  hoistedNodesByBlock.clear();
}
