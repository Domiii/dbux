import { getDefaultClient } from '../client/index';

/**
 * dbux-runtime implementation of collection.
 * (responsible for sending data)
 */
export default class Collection {
  _all = [null];

  constructor(name) {
    this._name = name;
  }

  getAll() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }

  send(newEntry) {
    const client = getDefaultClient();
    client.send(this._name, newEntry);
  }
}