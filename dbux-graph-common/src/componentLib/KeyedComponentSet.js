import isFunction from 'lodash/isFunction';

export default class KeyedComponentSet {
  owner;
  ComponentClass;
  componentsById = new Map();

  /**
   * @type {Map}
   */
  entriesByKey;

  constructor(owner, ComponentClass, cfg) {
    this.owner = isFunction(owner) ? owner : () => owner;
    this.ComponentClass = ComponentClass;

    Object.assign(this, cfg);
  }

  makeKey(entry) {
    return entry?.id || 0;
  }


  getComponentByEntry(entry) {
    const key = this.makeKey(entry);
    return this.getComponentByKey(key);
  }

  getComponentByKey(key) {
    return this.componentsById.get(key);
  }

  update(entries) {
    const oldKeys = new Set(this.componentsById.keys());
    const newEntries = new Map(entries.map(entry => [this.makeKey(entry), entry]));

    // remove old components
    for (const comp of this.componentsById.values()) {
      const { key } = comp.state;
      if (!newEntries.has(key)) {
        this.removeComponent(key);
      }
    }

    // add new components
    for (const [key, entry] of newEntries.entries()) {
      if (key && !oldKeys.has(key)) {
        this.addComponent(key, entry);
      }
    }

    this.entriesByKey = newEntries;
  }

  // ###########################################################################
  // run node management
  // ###########################################################################

  addComponent(key, entry) {
    const owner = this.owner(key, entry);
    if (!owner) {
      throw new Error(`owner not found for id=${key}, entry=${JSON.stringify(entry)} via: ${this.owner}`);
    }
    const newComponent = owner.children.createComponent(this.ComponentClass, { key, ...entry });
    this.componentsById.set(key, newComponent);
    return newComponent;
  }

  removeComponent(key) {
    const comp = this.componentsById.get(key);
    this.componentsById.delete(key);
    comp.dispose();
  }
}