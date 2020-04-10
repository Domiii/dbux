
export default class ProjectList {
  _list = [];

  getAt(i) {
    return this._list[i];
  }

  * [Symbol.iterator]() {
    yield* this._list;
  }
}