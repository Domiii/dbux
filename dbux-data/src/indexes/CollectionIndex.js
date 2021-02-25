import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';


const ArrayIndexManager = {
  createNew() {
    return [];
  },
  get(key) {
    return this._byKey[key];
  },
  set(key, container) {
    this._byKey[key] = container;
  },
  getAllKeys() {
    const keys = [];
    for (let i = 0; i < this._byKey.length; ++i) {
      if (this.get(i)) {
        keys.push(i);
      }
    }
    return keys;
  }
};

const MapIndexManager = {
  createNew() {
    return new Map();
  },
  get(key) {
    return this._byKey.get(key);
  },
  set(key, container) {
    this._byKey.set(key, container);
  },
  getAllKeys() {
    return Array.from(this._byKey.keys());
  }
};

const ArrayContainerMethods = {
  createNewContainer() {
    return [];
  },
  getFirstInContainter(container) {
    return container[0] || null;
  },
  addEntryToKey(container, entry) {
    container.push(entry);
  }
};

const SetContainerMethods = {
  createNewContainer() {
    return new Set();
  },
  getFirstInContainter(container) {
    return container.values().next().value || null;
  },
  addEntryToKey(container, entry) {
    container.add(entry);
  }
};

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
    this.log = newLogger(`${indexName} (Index)`);
    this.addOnNewData = addOnNewData;
    this.isMap = isMap;
    this.isContainerSet = isContainerSet;

    if (this.isMap) {
      this._manager = ArrayIndexManager;
    }
    else {
      this._manager = MapIndexManager;
    }
    this._manager = Object.fromEntries(
      Object.entries(this._manager).map(([name, func]) => [name, func.bind(this)])
    );

    if (this.isContainerSet) {
      this._containerMethods = SetContainerMethods;
    }
    else {
      this._containerMethods = ArrayContainerMethods;
    }
    this._containerMethods = Object.fromEntries(
      Object.entries(this._containerMethods).map(([name, func]) => [name, func.bind(this)])
    );
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

  getAllKeys() {
    return this._manager.getAllKeys();
  }

  /**
   * @param {T} entry 
   */
  addEntry(entry) {
    const key = this.makeKey(this.dp, entry);
    if (key === undefined) {
      // debugger;
      this.log.error('makeKey returned undefined');
      return;
    }
    if (key === false) {
      // entry is filtered out; not part of this index
      return;
    }

    let container = this.get(key);
    if (!container) {
      container = this._containerMethods.createNewContainer();
      this._manager.set(key, container);
    }
    this.beforeAdd?.(container, entry);
    this._containerMethods.addEntryToKey(container, entry);

    // sanity check
    // if (container.includes(undefined)) {
    //   this.log.error('Index contains undefined values', key, entry, container);
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
    this.addEntry(entry);
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