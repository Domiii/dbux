import Project from './Project';

export default class ProjectList {
  /**
   * @type {Project[]}
   */
  _list = [];
  _map = new Map();

  constructor(manager) {
    this.manager = manager;
    this._bugByIdMap = new Map();
  }

  add(...projects) {
    projects.forEach((project) => {
      Array.from(project.getOrLoadBugs()).forEach(bug => this._bugByIdMap.set(bug.id, bug));

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

  getBugById(bugId) {
    return this._bugByIdMap.get(bugId);
  }

  * [Symbol.iterator]() {
    yield* this._list;
  }
}