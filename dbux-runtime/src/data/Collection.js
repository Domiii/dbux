import { newLogger } from '@dbux/common/src/log/logger';
import { getDefaultClient } from '../client/index';

/**
 * dbux-runtime implementation of collection.
 * (responsible for sending data)
 * 
 * @template T
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

  push(entry) {
    entry._id = this._all.length;
    this._all.push(entry);
  }

  /**
   * @return {T}
   */
  getById(id) {
    return this._all[id];
  }

  /**
   * @return {T[]}
   */
  getAll() {
    return this._all;
  }

  getAllActual(startId = 1) {
    return this._all.slice(startId);
  }

  /**
   * @return {T}
   */
  getLast() {
    return this._all[this.getLastId()];
  }

  getLastId() {
    return this._all.length - 1;
  }

  getLastIndex() {
    return this.getLastId();    // id is index
  }

  /**
   * @return {T}
   */
  getByIndex(i) {
    return this.getById(i);     // id is index
  }

  /**
   * 
   */
  _send(newEntry) {
    const client = getDefaultClient();
    client.send(this._name, newEntry);
  }

  /**
   * 
   */
  _sendAll(newEntries) {
    const client = getDefaultClient();
    client.sendAll(this._name, newEntries);
  }
}