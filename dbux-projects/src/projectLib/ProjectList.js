
export default class ProjectList {
  _list = [];

  constructor(manager) {
    this.manager = manager;
  }

  getAt(i) {
    return this._list[i];
  }

  * [Symbol.iterator]() {
    yield* this._list;
  }
}