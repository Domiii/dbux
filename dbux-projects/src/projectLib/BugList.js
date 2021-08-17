import { newLogger } from '@dbux/common/src/log/logger';
import Bug from './Bug';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

export default class BugList {
  /**
   * @type {Bug}
   */
  _list = [];
  _byId = new Map();

  /**
   * 
   * @param {*} project 
   * @param {Object[]} arr 
   */
  constructor(project, arr) {
    this.project = project;
    let lastBugNumber = 0;
    const hasIds = arr.some(bug => !!bug.id);

    for (const cfg of arr) {
      // cleanup
      if (!cfg.number) {
        // ensure cfg.number exists(type number)
        cfg.number = hasIds ? cfg.id : ++lastBugNumber;
      }
      if (cfg.bugLocations && !cfg.bugLocations.length) {
        // we use `!!bug.bugLocations` to determine whether this bug is "solvable"
        cfg.bugLocations = null;
      }


      // convert number typed id to string type(thus it's globally unique)
      const id = cfg.id = `${project.name}#${cfg.number}`;
      const bug = new Bug(project, cfg);
      this._list.push(bug);

      if (this._byId.get(id)) {
        // ignore bugs with same id
        logError(`${project} has multiple bugs with same id "${id}"`,
          'Make sure to have unique ids for every bug, or do not assign "id" to any bug.',
          'Ignoring duplicates for now.');
        continue;
      }

      this._byId.set(id, bug);
    }
  }

  /**
   * @return {ProjectsManager}
   */
  get manager() {
    return this.project.manager;
  }

  /**
   * @return {Bug}
   */
  getById(id) {
    return this._byId.get(id) || null;
  }

  getAt(i) {
    return this._list[i];
  }

  *[Symbol.iterator]() {
    yield* this._list;
  }
}