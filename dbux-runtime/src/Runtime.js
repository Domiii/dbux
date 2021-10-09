import { newLogger } from '@dbux/common/src/log/logger';
import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import pull from 'lodash/pull';
import last from 'lodash/last';
import Stack from './Stack';
import traceCollection from './data/traceCollection';
import scheduleNextPossibleRun from './scheduleNextPossibleRun';
import RuntimeAsync from './async/RuntimeAsync';
import executionContextCollection from './data/executionContextCollection';
import { VirtualRef } from './data/valueCollection';

// import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
// import executionContextCollection from './data/executionContextCollection';
// import staticContextCollection from './data/staticContextCollection';

// class PromisifyData {
  
// }

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('Runtime');

// function mergeStacks(dst, src) {
//   if ((src?.getDepth() || 0) > 0) {
//     // this should actually never be necessary
//     logError('Trying to resume interrupted stack, but there was already .');
//   }
// }

/**
 * Manages the executing as well as all interrupted stacks.
 * Does not interact with database.
 */
export default class Runtime {
  static _instance;
  /**
   * Singleton
   * @type {Runtime}
   */
  static get instance() {
    return this._instance || (this._instance = new Runtime());
  }

  /**
   * Set of all interrupted stacks.
   * @type {Map<int, Stack>}
   */
  _waitingStacks = new Map();

  /**
   * Mysterious stuff...
   * @type {Stack[]}
   */
  _interruptedStacksOfUnknownCircumstances = [];

  /**
   * The currently executing stack.
   * @type {Stack}
   */
  _executingStack = null;

  /**
   * Used for root management
   */
  _currentRunId = 0;
  _maxRunId = 0;

  _lastTraceByContextId = {};

  _bcesInByContextId = {};

  /**
   * @type {RuntimeAsync}
   */
  async = new RuntimeAsync(this);

  /**
   * @type {VirtualRef[]}
   */
  _promisifyStack = [];

  // ###########################################################################
  // Stack management
  // ###########################################################################

  /**
   * The amount of stacks that are waiting or were interrupt and are still kicking around
   */
  getLingeringStackCount() {
    return this._waitingStacks.size + this._interruptedStacksOfUnknownCircumstances.length;
  }

  _executeEmptyStackBarrier = () => {
    if (this.isExecuting()) {
      // we had an unhandled interrupt (should never happen?)
      // console.warn('interrupt');
      this.interrupt();
    }
    this._emptyStackBarrier = null;

    // this.thread1.processAsyncPromises();
  }

  isContextWaiting(contextId) {
    return this._waitingStacks.has(contextId);
  }

  /**
   * We currently have no good heuristics for checking whether we want to resume
   * an interrupted stack when pushing to an empty stack.
   * Instead, we need to rely on `_maybeResumeInterruptedStackOnPop` to try healing things

   * retroactively.
   */
  _maybeResumeInterruptedStackOnPushEmpty(contextId) {
    if (this._waitingStacks.has(contextId)) {
      // resume previous stack
      this.resumeWaitingStackAndPopAwait(contextId);
      return true;
    }
    else {
      const mysteriousStack = this._interruptedStacksOfUnknownCircumstances.find(stack => stack._stack.includes(contextId));
      if (mysteriousStack) {
        warn('found mysterious stack for contextId:', contextId);
        this._runStart(mysteriousStack);
        return true;
      }
      else if (!this.isExecuting()) {
        // normal beginning of new run
        this.newStack();
        return true;
      }
    }

    // keeps existing stack
    return false;
  }


  /**
   * Make sure to insert the "empty stack barrier" right after the current stack has fully unraveled.
   * TODO: In practice this is not perfect since some blackboxed mechanics might have called 
   * `setImmediate` beforehand, causing the current stack to be resumed in the wrong context.
   */
  _ensureEmptyStackBarrier() {
    // debug('_ensureEmptyStackBarrier', !!this._emptyStackBarrier);
    if (!this._emptyStackBarrier) {
      this._emptyStackBarrier = scheduleNextPossibleRun(this._executeEmptyStackBarrier);
    }
  }
  /**
   * We are now waiting for given context on current stack
   */
  _markWaiting(contextId) {
    if (!this._waitingStacks.has(contextId)) {
      this._executingStack.markWaiting();
      this._waitingStacks.set(contextId, this._executingStack);
    }
  }

  _markResume(contextId) {
    this._executingStack.markResumed();
    this._waitingStacks.delete(contextId);
    // console.warn('<-', contextId);
  }

  _onPop(contextId) {
    if (this._waitingStacks.has(contextId)) {
      this._markResume(contextId);
    }
  }

  /**
   * NOTE: in JS, we might pop a context that is not on top; intermediate contexts are in waiting
   */
  _popAnywhere(contextId) {
    const stack = this._executingStack;
    if (stack.isAtTop(contextId)) {
      this._onPop(contextId);
      return stack.popTop();
    }
    if (stack.isAtPeek(contextId)) {
      this._onPop(contextId);
      return stack.popPeekNotTop();
    }

    // we are popping a context that is not at the top nor peek of the stack,
    // meaning that all intermediate contexts are now in waiting
    const oldPeekIdx = stack.getPeekIndex();
    const stackPos = stack.popOther(contextId);
    if (stackPos !== -1) {
      this._onPop(contextId);

      // all contexts between the one that got popped, and the old peek are now considered "in waiting"
      for (let i = stackPos; i < oldPeekIdx; ++i) {
        const intermediateContextId = stack._stack[i];
        // if (!stack.isPoppedButStillAround(intermediateContextId)) {
        // mark as waiting, if it wasn't already popped
        this._markWaiting(intermediateContextId);
        // }
      }
    }
    return stackPos;
  }

  // ###########################################################################
  // Traces
  // ###########################################################################

  setLastContextTrace(contextId, traceId) {
    this._lastTraceByContextId[contextId] = traceId;
  }

  addBCEForContext(contextId, traceId) {
    let bceStack = this._bcesInByContextId[contextId];
    if (!bceStack) {
      bceStack = this._bcesInByContextId[contextId] = [];
    }
    bceStack.push(traceId);
  }

  /**
   * Might auto-adjust stack pointer, if it sees an AWAIT at the top.
   * Returns stack peek context.
   */
  fixPeekParentContextId() {
    let contextId = this.peekCurrentContextId();
    if (contextId) {
      const context = executionContextCollection.getById(contextId);
      if (!context) { // NOTE: should never happen
        logTrace(`Tried to peekCurrentContextId, but context was not registered - stack=${this._executingStack?.humanReadable()}`);
        return 0;
      }
      if (ExecutionContextType.is.Await(context.contextType)) {
        this.skipPopPostAwait();
        return this.fixPeekParentContextId();
      }
    }
    return contextId;
  }

  /**
   * Determine `parentTraceId` (which trace pushed which context).
   */
  getParentTraceId() {
    const parentContextId = this.peekCurrentContextId();
    const lastTraceId = parentContextId && this.getLastTraceInContext(parentContextId);
    const lastTrace = lastTraceId && traceCollection.getById(lastTraceId);
    if (lastTrace?.callId) {
      // last trace was a parameter or a BCE -> return BCE
      // return this._bcesInByContextId[parentContextId];
      return lastTrace?.callId;
    }

    // this context was probably not created by a call.
    //    it was probably a getter, proxy trap etc.
    //    in this case, just assume that the parent is the last trace.
    return lastTraceId;
  }

  /**
   * Get the last trace (before/excluding `Pop`!).
   * We use this in `TraceCollection#resolveErrorTraces` to determine whether a trace is an `error` trace.
   */
  getLastTraceInContext(contextId) {
    return this._lastTraceByContextId[contextId];
  }

  // ###########################################################################
  // Public getters
  // ###########################################################################

  isExecuting() {
    return !!this._executingStack?.length;
  }

  getStackDepth() {
    return this._executingStack?.getDepth() || 0;
  }

  getCurrentRunId() {
    return this._currentRunId;
  }

  /**
   * Same as `getVirtualRootContext()`, except when in async functions.
   * In `async` functions, this returns the root context of the real context.
   */
  peekRealRootContextId() {
    if (!this._executingStack || this._executingStack.isEmptySync()) {
      return 0;
    }
    return this._executingStack.peek();
  }

  /**
   * Returns the oldest ancestor context within the current run.
   */
  getCurrentVirtualRootContextId() {
    return this._virtualRootContextId;
  }

  getMaxRunId() {
    return this._maxRunId;
  }

  // /**
  //  * Looks up the stack until it finds a context that is Immediate.
  //  */
  // getRealParentContextId() {
  //   if (!this._executingStack) {
  //     return null;
  //   }

  //   for (const i = this._executingStack.getPeekIndex(); --i; i >= 0) {
  //     const contextId = this._executingStack._stack[i];
  //     const context = ;
  //     if (contextId) {

  //     }
  //   }

  //   return null;
  // }

  peekCurrentContextId() {
    return this._executingStack?.peek() || null;
  }

  // ###########################################################################
  // Push + Pop basics
  // ###########################################################################

  beforePush(/* contextId */) {
    this._ensureEmptyStackBarrier();
    this._maybeResumeInterruptedStackOnPushEmpty(/* contextId */);

    // TODO: when unconditionally overriding current context, traces receive incorrect `contextId`
    //  -> do we need to set peek to contextId? for what?

    // if (contextId) {
    //   this._executingStack.trySetPeek(contextId);
    // }
    // }
  }

  push(contextId, isInterruptable = false) {
    // this._previousPoppedContextId = null;
    this._executingStack.push(contextId);

    // this._runtimeThreadStack.push(contextId);

    if (isInterruptable) {
      // start with a resume context
      this._markWaiting(contextId);
    }

    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug(`-> ${context.runId} ${contextId} [${typeName}] ${name}`);
  }

  pop(contextId) {
    // const context = executionContextCollection.getById(contextId);
    // const staticContext = staticContextCollection.getById(context.staticContextId);
    // const name = staticContext.displayName || '';
    // const typeName = ExecutionContextType.nameFromForce(context.contextType);
    // console.debug(`<- ${context.runId} ${contextId} [${typeName}] ${name}`);

    // this._runtimeThreadStack.pop(contextId);

    this._lastPoppedContextId = contextId;

    let stack = this._executingStack;
    let stackPos;

    if (!stack) {
      // we probably had an unhandled interrupt that is now resumed
      stack = this.resumeWaitingStackAndPopAwait(contextId);
      if (!stack) {
        logError(`Could not pop contextId off stack because there is stack active, and no waiting stack registered with this contextId`, contextId);
        return -1;
      }
      stackPos = this._popAnywhere(contextId);
    }
    else {
      // first check, if its on this stack, then check for waiting stacks
      stackPos = this._popAnywhere(contextId);
    }

    // if (stackPos === -1) {
    //   // popped root off stack
    //   if (stack.getUnpoppedCount() && !stack.hasWaiting()) {
    //     // there is stuff left to do on this stack, but we don't know why and how
    //     this._interruptedStacksOfUnknownCircumstances.push(stack);
    //   }

    //   // TODO: our shadow stack is not accurate enough for this to work correctly
    //   // this._runFinished();
    // }
    return stackPos;
  }

  popTop() {
    const contextId = this._executingStack.top();
    this._executingStack.popTop();
    return contextId;
  }

  _lastPoppedContextId = null;
  getLastPoppedContextId() {
    return this._lastPoppedContextId;
  }

  /**
   * no previous executing stack to resume
   *  -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
   */
  newStack() {
    // if (!this._executingStack) {
    const newStack = Stack.allocate();
    this._runStart(newStack);
  }

  /**
   * NOTE: we use this to make sure that every `postAwait` event has its own `run`.
   */
  newRun() {
    this._currentRunId = ++this._maxRunId;
    // debug(`newRun`, this._currentRunId);
    return this._currentRunId;
  }

  _switchStackOnResume(contextId) {
    const waitingStack = this._waitingStacks.get(contextId);
    if (!waitingStack) {
      return null;
    }

    // waitingStack.resumeFrom(contextId);
    const oldStack = this._executingStack;

    // console.log(oldStack, waitingStack);

    if (oldStack !== waitingStack) {
      if (this.isExecuting()) {
        // eslint-disable-next-line max-len,no-console
        logTrace(`resume received for contextId=${contextId} while already executing (${this._executingStack?.length}) - not handled properly yet. Discarding executing stack.\noldStack (${oldStack.length}) = ${oldStack._stack?.join(',')}\nwaitingStack (${waitingStack.length}) = ${waitingStack._stack?.join(',')}`);
        this.interrupt();
      }

      this._runStart(waitingStack);
    }

    return waitingStack;
  }


  /**
   * Put current stack into "wait queue"
   */
  interrupt() {
    if (!this.isExecuting()) {
      logError('Tried to interrupt but there is no executing stack');
      return;
    }
    this._interruptedStacksOfUnknownCircumstances.push(this._executingStack);

    this._runFinished();
    // this._previousPoppedContextId = null;
  }

  /** ###########################################################################
   * promisify
   *  #########################################################################*/

  /**
   * hackfix: this is currently a placeholder object that will ultimately represent the promise's `promiseId`.
   * @returns {VirtualRef}
   */
  getPromisifyPromiseVirtualRef() {
    if (!this._promisifyStack.length) {
      return null;
    }
    // const contextIdIndex = last(this._promisifyStack);
    // return this._executingStack?._stack[contextIdIndex];
    return last(this._promisifyStack);
  }

  /**
   * Keep track of (purely synchronous) promisify (promise ctor) stack.
   */
  promisifyStart(promiseVirtualRef) {
    // const peek = this._executingStack?._peekIdx || 0;
    this._promisifyStack.push(promiseVirtualRef);
  }

  promisifyEnd(promiseVirtualRef) {
    // this._promisifyStack.pop();
    // NOTE: should always be last
    pull(this._promisifyStack, promiseVirtualRef);
  }

  // ###########################################################################
  // async stuff
  // ###########################################################################

  registerAwait(awaitContextId, parentContext, awaitArgument) {
    if (!this.isExecuting()) {
      logError('Encountered `await`, but there was no active stack ', awaitContextId);
      return;
    }

    this.push(awaitContextId, true);

    // NOTE: we already marked it as waiting when we pushed the real context
    // NOTE: stack might keep popping before it actually pauses, so we don't unset executingStack quite yet.
    this._markWaiting(awaitContextId);
  }

  /**
   * Manually climb up the stack.
   * NOTE: We are waiting now, and see on the stack:
   *    1. Await (top)
   *    2. async function (top-1)
   * -> However, next trace will be outside of the function, so we want to skip both.
   */
  skipPopPostAwait() {
    this._executingStack._peekIdx -= 2;
  }

  /**
   * Finds the stack containing the given realContext, resumes the stack
   * and then calls `resumeWaitingStack` on its top context.
   */
  resumeWaitingStackReal(realContextId) {
    const waitingStack = this._switchStackOnResume(realContextId);
    if (!waitingStack) { return null; }

    const resumeContextId = this._executingStack.top();

    // pop the await/yield context
    this._markResume(resumeContextId);
    this.pop(resumeContextId);

    return waitingStack;
  }

  /**
   * Finds the stack containing the given `Resume` context, resumes the stack
   * and pops the `Resume` context.
   */
  resumeWaitingStackAndPopAwait(awaitContextId) {
    const waitingStack = this._switchStackOnResume(awaitContextId);
    if (!waitingStack) {
      logTrace('resumeWaitingStack called on unregistered `resumeContextId`:', awaitContextId);
      return null;
    }

    // pop the await/yield context
    this._markResume(awaitContextId);
    this.pop(awaitContextId);

    return waitingStack;
  }

  // ###########################################################################
  // Manage "execution roots"
  // ###########################################################################

  _runStart(stack) {
    this.newRun();
    this._executingStack = stack;
    // console.warn('[RunStart] ' + this._currentRunId, new Error().stack); //, this.getLingeringStackCount());
    // getDefaultClient().bufferBreakpoint();
    // debug('[new run]', this._currentRunId);
  }

  /**
   * Called:
   * * during `pushImmediate`, if there is no parent on the stack
   * * during `postAwait`, after `pushResume`
   */
  _updateVirtualRootContext(contextId) {
    // debug(`[updateVirtualRootContext] ${contextId}`);
    this._virtualRootContextFinished(contextId);
  }

  _virtualRootContextFinished(newRootId) {
    // if (this._virtualRootContextId) {
    //   const previousRootId = this._virtualRootContextId;
    // }
    this._virtualRootContextId = newRootId;
    this.async.virtualRootStarted(newRootId);

    // debug('[new root]', newRootId);
  }

  _runFinished() {
    this._executingStack = null;

    // NOTE: don't unset this, so `postThen` always gets access to it
    // this._virtualRootContextFinished(0);

    // TODO: change to post-process all `virtualRootContexts` of run

    // this.thread2.postRun();
    // console.warn('[RunEnd]', this._currentRootId, this.getLingeringStackCount(), new Error().stack);
    // console.timeEnd('[RunEnd] ' + this._currentRunId);
  }
}
