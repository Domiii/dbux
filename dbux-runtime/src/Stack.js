

export default class Stack {
  /**
   * @returns {Stack}
   */
  static allocate() {
    // TODO: use pool
    return new Stack();
  }

  /**
   * @type {int[]}
   */
  _stack = [];
  _waitCount = 0;
  _unpoppedCount = 0;

  hasUnpoppedBusiness() {
    return !!this._unpoppedCount;
  }

  isWaiting() {
    return !!this._waitCount;
  }
  
  getDepth() {
    return this._stack.length;
  }

  peek() {
    const l = this._stack.length;
    return l && this._stack[l-1] || null;
  }

  push(x) {
    ++this._unpoppedCount;
    this._stack.push(x);
  }

  pop() {
    --this._unpoppedCount;
    return this._stack.pop();
  }

  indexOf(contextId) {
    return this._stack.indexOf(contextId);
  }
  /** 
   * NOTE: in JS, we might pop a context that is not on top -> will pop unpopped contexts later
   */
  popAnywhere(contextId) {
    if (this.peek() === contextId) {
      this._stack.pop();
      return this._stack.length;
    }

    // we will keep context on stack and pop it later
    const i = this.indexOf(contextId);
    // this._stack.splice(i, 1);
    return i;
  }

  markWaiting() {
    ++this._waitCount;
  }

  markResumed() {
    --this._waitCount;
  }
}