

export default class Stack {
  _stack = [];


  getDepth() {
    return this._stack.length;
  }

  peek() {
    const l = this._stack.length;
    return l && this._stack[l-1] || null;
  }

  push(x) {
    this._stack.push(x);
  }

  pop() {
    return this._stack.pop();
  }
}