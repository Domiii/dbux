import pull from 'lodash/pull';

class HostComponentList {
  components = [];

  constructor(parent) {
    this.parent = parent;
  }

  // ###########################################################################
  // iterator
  // ###########################################################################

  * [Symbol.iterator]() {
    yield* this.components;
  }

  // ###########################################################################
  // Manage the list
  // ###########################################################################

  reset() {
    this.setComponents([]);
  }

  create(ComponentClass, initialState) {
    const comp = ComponentClass.create(initialState);
    this.addComponent(comp);
    return comp;
  }

  addComponent(...components) {
    return this.addComponents(components);
  }

  addComponents(components) {
    this.components.push(...components);

    // TODO: send to remote
  }

  setComponents(components) {
    this.components = [...components];

    // TODO: send to remote
  }

  /**
   * NOTE: Do not call `_removeComponent` directly.
   * Call `unwantedComponent.remove()` instead.
   */
  _removeComponent(component) {
    pull(this.components, component);
    
    // TODO: send to remote
  }
}

export default HostComponentList;