import { getScopeBlockPathInstrument } from '../helpers/scopeHelpers';

/**
 * 1. Get scope block of targetPath.
 * 2. Add newNodes to the beginning of that block.
 */
export function unshiftScopeBlock(targetPath, newNodes) {
  const scopeBlockPath = getScopeBlockPathInstrument(targetPath);
  return scopeBlockPath.unshiftContainer("body", newNodes);
}


/**
 * 1. Get scope block of targetPath.
 * 2. Add newNodes to the end of that block.
 */
export function pushScopeBlock(targetPath, newNodes) {
  const scopeBlockPath = getScopeBlockPathInstrument(targetPath);
  return scopeBlockPath.pushContainer("body", newNodes);
}