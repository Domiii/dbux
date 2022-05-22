/**
 * @param {Object} input 
 */
export function typedShallowClone(input) {
  const result = new input.constructor();
  Object.assign(result, input);
  return result;
}