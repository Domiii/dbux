import Project from './Project';

export default class ProjectList {
  /**
   * @type {Project[]}
   */
  _list = [];
  _map = new Map();

  constructor(manager) {
    this.manager = manager;
  }

  add(...projects) {
    projects.forEach((project) => {
      this._map.set(project.name, project);
      this._list.push(project);
    });
  }

  getAt(i) {
    return this._list[i];
  }

  /**
   * @param {string} name 
   * @return {Project}
   */
  getByName(name) {
    return this._map.get(name);
  }

  * [Symbol.iterator]() {
    yield* this._list;
  }
}