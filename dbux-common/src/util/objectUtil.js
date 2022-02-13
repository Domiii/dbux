import isObject from 'lodash/isObject';


function joinPath(a, b) {
  if (a) {
    return a + '.' + b;
  }
  return b;
}

/**
 * Iterates given object using DFS and Object.keys.
 * @return The first path of a nested prop that matches the given predicate.
 */
export function findPathInObject(o, predicate, parentPath = '') {
  if (Array.isArray()) {
    return findPathArray(o, predicate, parentPath);
  }
  else {
    return findPathPlainObject(o, predicate, parentPath);
  }
}

function findPathArray(arr, predicate, parentPath) {
  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];
    const path = joinPath(parentPath, i);
    if (predicate(value)) {
      return path;
    }
    if (isObject(value)) {
      const result = findPathInObject(value, predicate, path);
      if (result) {
        return result;
      }
    }
  }
  return null;
}


/**
 * Iterates given object using Object.keys.
 * NOTES:
 *   * Object.keys is also how msgPack iterates, but its different from how dbux does it.
 *   * Our valueCollection, on the other, hand uses the a simple for loop instead because it reveals a lot more props than Object.keys.
 */
function findPathPlainObject(o, predicate, parentPath) {
  const keys = Object.keys(o);
  for (const key of keys) {
    const value = o[key];
    const path = joinPath(parentPath, key);
    if (predicate(value, key, parentPath)) {
      return path;
    }
    if (isObject(value)) {
      const result = findPathInObject(value, predicate, path);
      if (result) {
        return result;
      }
    }
  }
  return null;
}
