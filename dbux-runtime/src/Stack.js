import { newLogger } from '@dbux/common/src/log/logger';
import executionContextCollection from './data/executionContextCollection';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Stack');


/**
 * A stack with rudimentary async support:
 * At any point, it maintains the set of all unpopped contexts, including the deepest context ("top"), 
 * as well as the "peek" position, the position that we last visited.
 * NOTE: The fact that "top" is different from "peek" comes from the fact that
 * async functions (and their virtual children) might not get popped immediately, while other functions
 * up the stack might.
 */
export default class Stack {
  /**
   * @returns {Stack}
   */
  static allocate() {
    // future-work: use pool
    return new Stack();
  }

  /**
   * @type {number[]}
   */
  _stack = [];
  _waitCount = 0;
  _peekIdx = -1;

  // getUnpoppedCount() {
  //   const poppedCount = this._poppedButStillAround && this._poppedButStillAround.size || 0;
  //   return this._stack.length - poppedCount;
  // }

  // isPoppedButStillAround(contextId) {
  //   return this._poppedButStillAround && this._poppedButStillAround.has(contextId) || false;
  // }

  /**
   * Considers whether `peekIndex` is pointing to anything.
   * If not, the "synchronous stack" is empty.
   */
  isEmptySync() {
    return this._peekIdx < 0;
  }

  hasWaiting() {
    return !!this._waitCount;
  }

  getDepth() {
    return this._stack.length;
  }

  getPeekIndex() {
    // return this.getUnpoppedCount() - this._waitCount;
    return this._peekIdx;
  }

  isAtPeek(contextId) {
    return this.peek() === contextId;
  }

  isAtTop(contextId) {
    return this.top() === contextId;
  }

  /**
   * Deepest `contextId` on the stack.
   */
  top() {
    return this._stack[this._stack.length - 1] || null;
  }

  /**
   * `contextId` at current `peek` position.
   */
  peek() {
    return this._stack[this._peekIdx] || null;
  }

  /**
   * `contextId` at current `peek` position.
   */
  peekTwo() {
    return [this._stack[this._peekIdx - 1], this._stack[this._peekIdx]];
  }

  isPeekTop() {
    return this._peekIdx === this._stack.length;
  }

  indexOf(contextId) {
    return this._stack.indexOf(contextId);
  }

  push(x) {
    // insert at peek
    this._stack.splice(++this._peekIdx, 0, x);
  }

  resumeFrom(contextId) {
    this._peekIdx = this._stack.indexOf(contextId);
  }

  popTop() {
    // const contextId = this.top();
    this._stack.pop();
    this._peekIdx = this._stack.length - 1;

    return this._stack.length - 1;
  }

  popPeekNotTop() {
    // const peekContextId = this.peek();
    this._stack.splice(this._peekIdx, 1);
    --this._peekIdx;

    // // we cannot actually remove this because it is technically still around
    // //    (even though, it technically was "popped")
    // if (!this._poppedButStillAround) {
    //   this._poppedButStillAround = new Set();
    // }
    // this._poppedButStillAround.add(peekContextId);
    return this._peekIdx;
  }

  /**
   * `contextId` is not at `top` and not at `peek`:
   * Keep it around, but "mark" it as popped.
   */
  popOther(contextId) {
    const i = this.indexOf(contextId);

    if (i >= 0) {
      this._peekIdx = i;
      this.popPeekNotTop();
    }
    return i;
  }

  skipPopAtPeek() {

  }

  trySetPeek(contextId) {
    if (this.peek() === contextId) {
      return;
    }
    const i = this.indexOf(contextId);
    if (i < 0) {
      logError('setPeek failed: contextId not on stack', contextId);
      return;
    }
    this._peekIdx = i;
  }

  markWaiting() {
    ++this._waitCount;
  }

  markResumed() {
    --this._waitCount;
  }

  get length() {
    return this._stack.length;
  }

  humanReadable() {
    const peekIdx = this._peekIdx;
    return this._stack.map((contextId, i) =>
      `${i === peekIdx ? '> ' : ''}${executionContextCollection.makeContextInfo(contextId)}`
    );
  }

  humanReadableString() {
    const stack = this.humanReadable();
    if (stack) {
      return '\n  ' + stack.join('\n  ');
    }
    return null;
  }
}