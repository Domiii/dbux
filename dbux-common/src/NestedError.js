/**
 * Nested Error.
 * Based on `nested-error-stacks`, but in ES6.
 * 
 * @see https://raw.githubusercontent.com/mdlavin/nested-error-stacks/master/index.js
 */
class NestedError extends Error {
  /**
   * @param {string} message
   * @param {Error?} cause 
   */
  constructor(message, cause) {
    super(message);

    if (message instanceof Error) {
      cause = message;
    }
    
    // hackfix: we also nest `message`, because the custom `stack` is ignored in some environments (e.g. jest (i.e. vm2))
    const nestedMsg = cause.message && `\n  [Caused By] ${cause.message}` || '';
    this.message = `${message}${nestedMsg}`;

    this.name = 'NestedError';
    this.cause = cause;

    // TODO: fix combined stack, to be less confusing (should not include messages multiple times)
    // const outer = this.outer = {};
    // Error.captureStackTrace(outer, this.constructor);
    // var oldStackDescriptor = Object.getOwnPropertyDescriptor(this, 'stack');
    // var stackDescriptor = buildStackDescriptor(oldStackDescriptor, nestedErr);
    Object.defineProperty(this, 'stack', {
      value: `${message || ''}\n  [Caused By] ${cause.stack || cause}`
    });
  }
}

// function buildStackDescriptor(outerErrorStackDescriptor, nestedErr) {
//   if (outerErrorStackDescriptor.get) {
//     return {
//       get: function () {
//         var outerStack = outerErrorStackDescriptor.get.call(this);
//         return buildCombinedStacks(this.nested?.stack, outerStack);
//       }
//     };
//   } else {
//     var outerStack = outerErrorStackDescriptor.value;
//     return {
//       value: buildCombinedStacks(nestedErr?.stack, outerStack)
//     };
//   }
// }

// function buildCombinedStacks(nested, outer) {
//   if (nested) {
//     nested = `[NestedError] ${nested}\n\n################################\n\n [Outer Error] ${outer}`;
//   }

//   return `${nested || outer}`;
// }


export default NestedError;