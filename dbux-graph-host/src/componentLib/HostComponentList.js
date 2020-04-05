import pull from 'lodash/pull';
import HostComponentManager from './HostComponentManager';

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
  // public methods
  // ###########################################################################

  createComponent(parent, ComponentClass, initialState) {
    const comp = this.parent.componentManager._createComponent(parent, ComponentClass, initialState);
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