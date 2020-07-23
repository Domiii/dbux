

export default class ObjectPool {
  constructor(Type) {
    this._Type = Type;
  }

  acquire() {
    // TODO
    return new this._Type();
  }

  release(/* obj */) {
    // TODO
  }
}