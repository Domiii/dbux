import Stack from './Stack';
import { logInternalError } from './log/logger';

function mergeStacks(dst, src) {
  // TODO: our stacks don't keep track of their history. 
  //  Instead, go into the collections and fix things there...?
}

/**
 * Manages all actively running "runs" (represented by stacks).
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
   * @type {Set<Stack>}
   */
  _interruptedStacks = new Set();

  /**
   * The currently executing stack.
   * @type {Stack}
   */
  _executingStack = null;


  // ###########################################################################
  // Stack management
  // ###########################################################################

  _executeEmptyStackBarrier = () => {
    if (this._executingStack) {
      // we had an unhandled interruption (e.g. await, alert, prompt etc.)
      this._interruptedStacks.add(this._executingStack);
      this._executingStack = null;
      this._previousPoppedContextId = null;
    }
  }

  _resumeInterruptedStack(interruptedStack) {
    this._interruptedStacks.delete(interruptedStack);
    if (this._executingStack) {
      mergeStacks(interruptedStack, this._executingStack);
    }
    this._executingStack = interruptedStack;
  }

  /**
   * We currently have no good heuristics for checking whether we want to resume
   * an interrupted stack when pushing to an empty stack.
   * Instead, we need to rely on `_maybeResumeInterruptedStackOnPop` to try healing things
   * retroactively.
   */
  _maybeResumeInterruptedStackOnPushEmpty() {
    if (true) {
      // new stack
      this._executingStack = Stack.allocate();
    }
    else {
      // resume previous stack
      // this._interruptedStacks.delete(this._executingStack);
    }
  }

  /**
   * Check if stack top matches given `contextId`;
   * if not, it probably belongs to some interrupted stack that we want to find instead.
   */
  _maybeResumeInterruptedStack(contextId) {
    const stackTop = this._executingStack?.peek();
    if (contextId !== stackTop) {
      // TODO: improve efficiency (e.g.: use a Map<contextId, Stack>, or prune stale stacks etc...)
      //    (NOTE: stacks might never go "stale", as some might be waiting for rare events)
      // NOTE: use traditional for loop over Array.find to reduce memory churn
      let resumingStack;
      for (let i = 0; i < this._interruptedStacks.length; ++i) {
        const stack = this._interruptedStacks[i];
        if (stack.peek() === contextId) {
          // found it!
          resumingStack = stack;
          break;
        }
      }

      if (!resumingStack) {
        // TODO: add more self-heal heuristics?
        logInternalError(
          'Tried to popImmediate context whose contextId does not match contextId on stack - ',
          contextId, '!==', this._executingStack?.peek()
        );
        return false;
      }
      else {
        this._resumeInterruptedStack(resumingStack);
      }
    }
    return true;
  }

  /**
   * Make sure to insert the "empty stack barrier" right after the current stack has fully unraveled.
   * TODO: In practice this is not perfect since some blackboxed mechanics might have called 
   * `setImmediate` beforehand, causing the current stack to be resumed in the wrong context.
   */
  _ensureEmptyStackBarrier() {
    if (!this._emptyStackBarrier) {
      this._emptyStackBarrier = setImmediate(this._executeEmptyStackBarrier);
    }
  }

  // ###########################################################################
  // Public getters
  // ###########################################################################

  getStackDepth() {
    return this._executingStack?.getDepth() || 0;
  }

  peekStack() {
    return this._executingStack?.peek() || null;
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  push(contextId) {
    if (!this._executingStack) {
      // no executing stack 
      //    -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
      this._ensureEmptyStackBarrier();
      this._maybeResumeInterruptedStackOnPushEmpty();
    }
    this._previousPoppedContextId = null;
    this._executingStack.push(contextId);
  }

  pop(contextId) {
    if (!this._maybeResumeInterruptedStack(contextId)) {
      // could not pop things
      return;
    }

    // actually pop
    const stackTop = this._executingStack.pop();
    this._previousPoppedContextId = stackTop;

    if (!this._executingStack.getDepth()) {
      // last on stack -> done with it!
      this._executingStack = null;
      this._previousPoppedContextId = null;
    }
  }
}