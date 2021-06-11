import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

// ###########################################################################
//  Mangers
// ###########################################################################

class IndexManager {
  constructor(index) {
    this.index = index;
  }

  createNew() {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  get(key) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  getOrCreateContainer(key) {
    throw new Error('abstract method not implemented');
  }

  getAllKeys() {
    throw new Error('abstract method not implemented');
  }
}

class ArrayIndexManager extends IndexManager {
  createNew() {
    return [];
  }

  get(key) {
    return this.index._byKey[key];
  }

  getOrCreateContainer(key) {
    let container = this.get(key);
    if (!container) {
      container = this.index._containerMethods.createNewContainer();
      this.index._byKey[key] = container;
    }
    return container;
  }

  getAllKeys() {
    const keys = [];
    for (let i = 0; i < this.index._byKey.length; ++i) {
      if (this.get(i)) {
        keys.push(i);
      }
    }
    return keys;
  }
}

class MapIndexManager extends IndexManager {
  createNew() {
    return new Map();
  }

  get(key) {
    return this.index._byKey.get(key);
  }

  getOrCreateContainer(key) {
    let container = this.get(key);
    if (!container) {
      container = this.index._containerMethods.createNewContainer();
      this.index._byKey.set(key, container);
    }
    return container;
  }

  getAllKeys() {
    return Array.from(this.index._byKey.keys());
  }
}

// ###########################################################################
//  Container methods
// ###########################################################################

class ContainerMethods {
  /**
   * @param {CollectionIndex} index 
   */
  constructor(index) {
    this.index = index;
  }

  createNewContainer() {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  getFirstInContainter(container) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  getLastInContainter(container) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  addEntry(container, entry) {
    throw new Error('abstract method not implemented');
  }
}

class ArrayContainerMethods extends ContainerMethods {
  createNewContainer() {
    return [];
  }

  getFirstInContainter(container) {
    return container?.[0];
  }

  getLastInContainter(container) {
    return container?.[container.length - 1];
  }

  addEntry(container, entry) {
    container.push(entry);
  }
}

class SetContainerMethods extends ContainerMethods {
  createNewContainer() {
    return new Set();
  }

  getFirstInContainter(container) {
    this.index.logger.warn(`Trying to get first item in a set container`);
    return container.values().next().value;
  }

  getLastInContainter(container) {
    this.index.logger.warn(`Trying to get last item in a set container`);
    return container.values().next().value;
  }

  addEntry(container, entry) {
    container.add(entry);
  }
}

/**
 * @template {T}
 */
export default class CollectionIndex {
  /**
   * @type {DataProvider}
   */
  dp;
  name;

  /**
   * @type {T[][]}
   */
  _byKey;

  constructor(collectionName, indexName, { addOnNewData = true, isMap = false, isContainerSet = false } = EmptyObject) {
    this.collectionName = collectionName;
    this.name = indexName;
    this.logger = newLogger(`${indexName} (Index)`);
    this.addOnNewData = addOnNewData;
    this.isMap = isMap;
    this.isContainerSet = isContainerSet;

    if (this.isMap) {
      this._manager = new MapIndexManager(this);
    }
    else {
      this._manager = new ArrayIndexManager(this);
    }

    if (this.isContainerSet) {
      this._containerMethods = new SetContainerMethods(this);
    }
    else {
      this._containerMethods = new ArrayContainerMethods(this);
    }
  }

  _init(dp) {
    this.dp = dp;
    this._byKey = this._manager.createNew();
  }

  // ###########################################################################
  //  public(usage)
  // ###########################################################################

  /**
   * @param {number} key 
   * @return {T[]}
   */
  get(key) {
    return this._manager.get(key);
  }

  getFirst(key) {
    const container = this.get(key);
    return this._containerMethods.getFirstInContainter(container) || null;
  }

  getLast(key) {
    const container = this.get(key);
    return this._containerMethods.getLastInContainter(container) || null;
  }

  getAll() {
    return this._byKey;
  }

  getAllKeys() {
    return this._manager.getAllKeys();
  }

  addEntryToKey(key, entry) {
    const container = this._manager.getOrCreateContainer(key);
    this.beforeAdd?.(container, entry);
    this._containerMethods.addEntry(container, entry);
  }

  /**
   * @param {T} entry 
   */
  addEntry(entry) {
    const key = this.makeKey(this.dp, entry);
    if (key === undefined) {
      // debugger;
      this.logger.error('makeKey returned undefined');
      return;
    }
    if (key === false) {
      // entry is filtered out; not part of this index
      return;
    }

    this.addEntryToKey(key, entry);

    // sanity check
    // if (container.includes(undefined)) {
    //   this.loger.error('Index contains undefined values', key, entry, container);
    // }
  }

  /**
   * @param {T[]} entries 
   */
  addEntries(entries) {
    for (const entry of entries) {
      this.addEntry(entry);
    }
  }

  addEntryById(id) {
    const entry = this.dp.collections[this.collectionName].getById(id);
    if (!entry) {
      this.logger.error(new Error(
        `Tried to ${this.constructor.name}.addEntryById(id = ${JSON.stringify(id)}), but there are no ${this.collectionName} with that id.`
      ).stack);
    }
    else {
      this.addEntry(entry);
    }
  }

  /** 
   * Returns a unique key (number) for given entry.
   * @param {DataProvider} dp
   * @param {T} entry 
   */
  makeKey(/* dp, entry */) {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.makeKey`);
  }
}