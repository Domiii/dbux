import pull from 'lodash/pull';
import isString from 'lodash/isString';

class HostComponentList {
  components = [];

  constructor(parent) {
    this.parent = parent;
  }

  // ###########################################################################
  // getter
  // ###########################################################################

  get length() {
    return this.components.length;
  }

  // ###########################################################################
  // iterator
  // ###########################################################################

  * [Symbol.iterator]() {
    yield* this.components;
  }

  // ###########################################################################
  // public methods
  // ###########################################################################

  createComponent(ComponentClassOrName, initialState) {
    const { registry } = this.parent.componentManager;
    let ComponentClass;
    if (!isString(ComponentClassOrName)) {
      ComponentClass = ComponentClassOrName;
    }
    else {
      ComponentClass = registry[ComponentClassOrName];
    }

    const comp = this.parent.componentManager._createComponent(this.parent, ComponentClass, initialState);
    this.components.push(comp);
    return comp;
  }

  clear() {
    for (let i = this.components.length - 1; i >= 0; --i) {
      this.components[i].dispose();
    }
  }

  // ###########################################################################
  // private methods
  // ###########################################################################

  /**
   * NOTE: Do not call `_removeComponent` directly.
   * Call `unwantedComponent.dispose()` instead.
   */
  _removeComponent(component) {
    pull(this.components, component);
  }
}

export default HostComponentList;