import { newLogger } from 'dbux-common/src/log/logger';
import Bug from './Bug';

const { log, debug, warn, error: logError } = newLogger('dbux-code');

export default class BugList {
  _list = [];
  _byId = new Map();

  constructor(project, arr) {
    this.project = project;
    let lastBugId = 0;
    const hasIds = arr.some(bug => !!bug.id);

    for (const cfg of arr) {
      const bug = new Bug(project, cfg);
      const id = hasIds ? bug.id : ++lastBugId;
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

  get manager() {
    return this.project.manager;
  }

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