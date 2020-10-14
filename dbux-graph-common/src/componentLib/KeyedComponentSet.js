export default class KeyedComponentSet {
  owner;
  ComponentClass;
  componentsById = new Map();

  constructor(owner, ComponentClass) {
    this.owner = owner;
    this.ComponentClass = ComponentClass;
  }

  getId(entry) {
    return entry?.id || 0;
  }
  
  getEntryById(entries, id) {
    return entries[id];
  }

  update(entries) {
    const oldIds = new Set(this.componentsById.keys());
    const newIds = new Set(entries.map(entry => this.getId(entry)));

    // remove old components
    for (const comp of this.componentsById.values()) {
      const { id } = comp.state;
      if (!newIds.has(id)) {
        this.removeComponent(id);
      }
    }

    // add new components
    for (const id of newIds) {
      if (id && !oldIds.has(id)) {
        const entry = this.getEntryById(entries, id);
        this.addComponent(id, entry);
      }
    }
  }

  // ###########################################################################
  // run node management
  // ###########################################################################

  addComponent(id, entry) {
    const newComponent = this.owner.children.createComponent(this.ComponentClass, { id, entry });
    this.componentsById.set(id, newComponent);
    return newComponent;
  }

  removeComponent(id) {
    const comp = this.componentsById.get(id);
    this.componentsById.delete(id);
    comp.dispose();
  }
}