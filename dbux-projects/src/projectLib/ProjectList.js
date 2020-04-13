import Project from './Project';

export default class ProjectList {
  /**
   * @type {Project[]}
   */
  _list = [];

  constructor(manager) {
    this.manager = manager;
  }

  add(...project) {
    this._list.push(...project);
  }

  getAt(i) {
    return this._list[i];
  }

  * [Symbol.iterator]() {
    yield* this._list;
  }
}