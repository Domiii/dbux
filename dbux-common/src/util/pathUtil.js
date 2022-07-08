/**
 * Flexible `basename` implementation
 * 
 * @see https://stackoverflow.com/a/59907288/2228771
 */
export function pathGetBasename(path) {
  // make sure the basename is not empty, if string ends with separator
  let end = path.length - 1;
  while (path[end] === '/' || path[end] === '\\') {
    --end;
  }

  // support Win + Unix path separator
  const i1 = path.lastIndexOf('/', end);
  const i2 = path.lastIndexOf('\\', end);

  let start;
  if (i1 === -1) {
    if (i2 === -1) {
      // no separator in the whole thing
      return path;
    }
    start = i2;
  }
  else if (i2 === -1) {
    start = i1;
  }
  else {
    start = Math.max(i1, i2);
  }
  return path.substring(start + 1, end + 1);
}

/**
 * 
 */
export function pathGetParent(path) {
  // make sure the basename is not empty, if string ends with separator
  let end = path.length - 1;
  while (path[end] === '/' || path[end] === '\\') {
    --end;
  }

  // support Win + Unix path separator
  const i1 = path.lastIndexOf('/', end);
  const i2 = path.lastIndexOf('\\', end);

  let last;
  if (i1 === -1) {
    if (i2 === -1) {
      // no separator in the whole thing
      return path;
    }
    last = i2;
  }
  else if (i2 === -1) {
    last = i1;
  }
  else {
    last = Math.max(i1, i2);
  }
  return path.substring(0, last);
}

/**
 * Somewhat safe-ish (safer than not doing this) path.
 * This is not actually safe, but it can help sometimes.
 */
export function pathSafeSegment(fpath) {
  return fpath.replace(/[:\\/]+/g, '-');
}

// tests

// console.table([
//   ['a/b/c', 'c'],
//   ['a/b/c//', 'c'],
//   ['a\\b\\c', 'c'],
//   ['a\\b\\c\\', 'c'],
//   ['a\\b\\c/', 'c'],
//   ['a/b/c\\', 'c'],
//   ['c', 'c']
// ].map(([input, expected]) => {
//   const result = pathGetBasename(input);
//   return {
//     input, 
//     result,
//     expected,
//     good: result === expected ? '✅' : '❌'
//   };
// }));


// console.table([
//   ['a/b/c', 'a/b'],
//   ['a/b/c//', 'a/b'],
//   ['a\\b\\c', 'a\\b'],
//   ['a\\b\\c\\', 'a\\b'],
//   ['a\\b\\c/', 'a\\b'],
//   ['a/b/c\\', 'a/b'],
//   ['c', 'c']
// ].map(([input, expected]) => {
//   const result = pathGetParent(input);
//   return {
//     input, 
//     result,
//     expected,
//     good: result === expected ? '✅' : '❌'
//   };
// }));