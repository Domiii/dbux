/**
 * Nested Error.
 * Based on `nested-error-stacks`, but in ES6.
 * 
 * @see https://raw.githubusercontent.com/mdlavin/nested-error-stacks/master/index.js
 */
class NestedError extends Error {
  constructor(message, nestedErr) {
    super(message);

    if (message instanceof Error) {
      nestedErr = message;
    }
    else if (message) {
      this.message = message;
    }

    this.name = 'NestedError';
    this.nested = nestedErr;

    Error.captureStackTrace(this, this.constructor);
  }

  stack() {
    const stack = super.stack?.() || '';
    return buildCombinedStacks(stack, this.nested);
  }
}

function buildCombinedStacks(stack, nested) {
  if (nested && nested) {
    stack += '\n---------------------------\nCaused By: ' + nested.stack;
  }
  return stack || nested;
}


export default NestedError;