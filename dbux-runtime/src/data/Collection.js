import { newLogger } from '@dbux/common/src/log/logger';
import { getDefaultClient } from '../client/index';

/**
 * dbux-runtime implementation of collection.
 * (responsible for sending data)
 */
export default class Collection {
  _all = [null];

  constructor(name) {
    if (!name) {
      throw new Error(`Collection did not provide name to ctor - ${this.constructor.name}`);
    }
    this._name = name;
    this.logger = newLogger(`${name} Collection`);
  }

  getAll() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }

  /**
   * @private
   */
  _send(newEntry) {
    const client = getDefaultClient();
    client.send(this._name, newEntry);
  }

  /**
   * @private
   */
  _sendAll(newEntry) {
    const client = getDefaultClient();
    client.sendAll(this._name, newEntry);
  }
}