import countBy from 'lodash/countBy';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';
import xor from 'lodash/xor';
import mergeWith from 'lodash/mergeWith';
import groupBy from 'lodash/groupBy';
import isString from 'lodash/isString';


/**
 * @param {[]]} arr 
 */
export function makeUnique(arr) {
  return Array.from(new Set(arr));
}

/**
 * @see https://stackoverflow.com/questions/29951293/using-lodash-to-compare-arrays-items-existence-without-order
 */
export function areArraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  return xor(a, b).length === 0;
}


/**
 * Get counts of array of numbers, then sort it.
 * @returns {{ type, count }[]}
 */
export function countAndSort(a) {
  const counts = map(
    countBy(a),
    (count, type) => ({ type, count }) // map single object to array of small objects
  );

  return sortBy(counts, o => -o.count);
}

export function getOrCreateArrayOfArray(arr, index) {
  return arr[index] = (arr[index] || []);
}

export function pushArrayOfArray(arr, index, ...items) {
  const nestedArr = getOrCreateArrayOfArray(arr, index);
  nestedArr.push(...items);
}

export function mergeConcatArray(...inputs) {
  return mergeWith(...inputs,
    function customizer(dst, src) {
      if (Array.isArray(dst)) {
        return dst.concat(src);
      }
      return undefined;
    }
  );
}

/**
 * TODO: [performance] Use proirity queue for array index
 * @see https://stackoverflow.com/a/26935688/11309695
 * @param  {any[][]} inputs 
 */
export function mergeSortedArray(inputs, makeKey = (e) => e) {
  const result = [];
  const indexPointers = Array(inputs.length).fill(0);
  const totalLength = inputs.reduce((sum, arr) => sum + arr.length, 0);

  for (let i = 0; i < totalLength; ++i) {
    let nextEntry = null;
    let chosenArrayIndex = null;
    for (let j = 0; j < inputs.length; ++j) {
      const possibleNextEntry = inputs[j][indexPointers[j]];
      if (!possibleNextEntry) continue;
      if (!nextEntry || makeKey(possibleNextEntry) < makeKey(nextEntry)) {
        nextEntry = possibleNextEntry;
        chosenArrayIndex = j;
      }
    }

    indexPointers[chosenArrayIndex]++;
    result.push(nextEntry);
  }

  return result;
}


// ###########################################################################
// binary search
// ###########################################################################

// use binary search to find arr.indexOf(x), arr must be sorted
export function binarySearchByKey(arr, x, makeKey) {
  if (makeKey) {
    arr = arr.map(makeKey);
    x = makeKey(x);
  }
  let start = 0;
  let end = arr.length - 1;
  let mid;

  while (start <= end) {
    mid = Math.floor((start + end) / 2);
    if (arr[mid] === x) return mid;
    else if (arr[mid] < x) start = mid + 1;
    else end = mid - 1;
  }

  // x not in arr
  return null;
}


export function groupBySorted(arr, prop) {
  const cmp = isString(arr[0][prop]) ?
    (a, b) => a.localeCompare(b) :
    (a, b) => a - b;
  return Object.values(groupBy(arr, prop),)
    .sort((groupA, groupB) => {
      const a = groupA[0][prop];
      const b = groupB[0][prop];
      return cmp(a, b);
    });
}
