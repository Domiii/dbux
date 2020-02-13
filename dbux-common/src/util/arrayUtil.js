import countBy from 'lodash/countBy';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';
import xor from 'lodash/xor';

export const EmptyArray = Object.freeze([]);

/**
 * @see https://stackoverflow.com/questions/29951293/using-lodash-to-compare-arrays-items-existence-without-order
 */
export function areArraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  
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