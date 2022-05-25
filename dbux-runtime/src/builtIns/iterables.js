/** @typedef { import("../ProgramMonitor").default } ProgramMonitor */


/**
 * 
 * @param {ProgramMonitor} programMonitor 
 * @param {*} inProgramStaticTraceId 
 * @param {Iterable} iterable 
 * @param {*} iterableTid 
 * @param {*} traceDeclareAndWrite 
 * @param {*} traceWrite 
 */
export function wrapIterable(inProgramStaticTraceId, iterable, iterableTid, traceDeclareAndWrite, traceWrite) {
  /**
   * "Whenever an object needs to be iterated (such as at the beginning of a for...of loop), 
   * its iterator method is called with no arguments, and the returned iterator is used to obtain the values to be iterated."
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
   * @type {Iterator}
   */
  const it = iterable?.[Symbol.iterator];
  if (!it?.next) {
    // non-well-formed iterable
    return it;
  }

  let declarationTid;

  const wrappedIterable = {
    [Symbol.iterator]() {
      return {
        next() {
          const next = it.next();
          if (!declarationTid) {
            declarationTid = traceDeclareAndWrite(inProgramStaticTraceId, value, []);
            // TODO: insert a read DataNode and add it as input to the write node
          }
          return next;
        }
      };
    }
  };
  return wrappedIterable;
}