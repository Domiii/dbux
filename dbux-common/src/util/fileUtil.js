import path from 'path'

/**
 * On Windows, path comparisons are case-insenstive, and also, VSCode likes to change the drive letter case seemingly at random;
 * causing usual string comparison to fail on paths.
 * 
 * For this to work we:
 * 1. resolve both paths (to normalized absolute paths)
 * 2. check if their relative path is empty (meaning they are the same file)
 */
export function arePathsIdentical(path1, path2) {
  return arePathsIdenticalDontResolve(path.resolve(path1), path.resolve(path2));
}

/**
 * Minor optimization alternative to `arePathsIdentical`,
 * in case paths are known to be properly resolved.
 */
export function arePathsIdenticalDontResolve(path1, path2) {
  return !path.relative(path1, path2);
}