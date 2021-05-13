import { newLogger } from '@dbux/common/src/log/logger';

import executionContextCollection from '../data/executionContextCollection';
import Runtime from '../Runtime.js';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('printContext');


export function printContext(contextId) {
  /**
   * @type {ExecutionContext}
   */
  const ec = executionContextCollection.getById(contextId);

  const {
    parentContextId, stackDepth, staticContextId
  } = ec;

  debug(`context`, contextId, `: parent context`, parentContextId, `, static context`, staticContextId, `, stack depth`, stackDepth);
}

export function printStack(stack) {
  debug(`stack`, stack);
}

/**
 * 
 * @param {Runtime} runtime 
 */
export function printRuntimeStack(runtime) {
  const { debug } = newLogger('printRuntimeStack');

  const {
    _executingStack,
    _waitingStacks,
  } = runtime;


  if (_executingStack) {
    debug("exec stack:", _executingStack);
  } else {
    debug("exec stack empty");
  }
  debug("waiting stack", _waitingStacks);
}