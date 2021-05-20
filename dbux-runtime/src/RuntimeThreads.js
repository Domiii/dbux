import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeThreads');

export class ExecutingStack {
  stack = [];

  constructor(stack = []) {
    this.stack = [...stack];
  }

  /**
   * Get the length of the executing stack.
   */
  length() {
    return this.stack.length;
  }

  /**
   * Push a context into executing stack.
   * @param {number} x Context id
   */
  push(x) {
    this.stack.push(x);
  }

  /**
   * Pop context `x` from executing stack.
   * Returns abandoned executing stack if `x` is not `top(1)`, `null` otherwise.
   * @param {number} x Context id
   * @return {ExecutingStack?}
   */
  pop(x) {
    if (this.stack[this.stack.length - 1] === x) {
      this.stack.pop();
      return null;
    } else {
      const index = this.stack.indexOf(x);
      if (index === -1) {
        warn(`Trying to pop ${x} but not in execting stack: ${this.stack}, ignoring.`);
        return null;
      } else {
        const abandonedStack = this.stack.splice(index);
        this.stack.pop();

        return new ExecutingStack(abandonedStack);
      }
    }
  }

  /**
   * @param {number} z 
   * @returns {number} The top `z` excuting stack context 
   */
  top(z = 1) {
    return this.stack[this.stack.length - z];
  }
}

export class RuntimeThreads {
  /**
   * @type {ExecutingStack} The current executing stack, filling with context id
   */
  currentStack = new ExecutingStack();

  /**
   * @type {Map<number, ExecutingStack>}
   */
  waitingStack = new Map();

  /**
   * Add a context id into the current stack
   * @param {number} contextId 
   */
  push(contextId) {
    this.currentStack.push(contextId);
  }  

  /**
   * Pop a context id from current stack
   * @param {number} contextId 
   */
  pop(contextId) {
    const abandonedStack = this.currentStack.pop(contextId);

    if (abandonedStack) {
      this.addWaitingStack(abandonedStack);
    }
  }

  /**
   * Add a stack into waiting stack.
   * @param {ExecutingStack} stack 
   */
  addWaitingStack(stack) {
    const lastContext = stack.top(1);
    this.waitingStack.set(lastContext, stack);
  }
  
  /**
   * Resume a stack with specific last context id back to executing stack
   * @param {number} x contextId
   */
  resumeWaitingStack(x) {
    const stack = this.waitingStack.get(x);
    if (!stack) {
      warn(`trying to resume a waiting stack with top = ${x} but not found.`);
    } else {
      if (this.currentStack.length !== 0) {
        warn(`trying to resume a waiting stack while there is still a stack with contexts executing. Put into waiting stack.`);
        this.addWaitingStack(this.currentStack);
      }

      this.currentStack = stack;
      this.waitingStack.delete(x);
    }
  }
}