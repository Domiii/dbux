import countBy from 'lodash/countBy';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';

export const EmptyArray = Object.freeze([]);
export const EmptyObject = Object.freeze({});


export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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