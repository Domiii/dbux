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
  // iterators
  // ###########################################################################

  *[Symbol.iterator]() {
    yield* this.components;
  }

  * filter(filter) {
    for (const child of this.components) {
      if (filter(child)) {
        yield child;
      }
    }
  }

  * dfs(filter) {
    for (const child of this.components) {
      if (!filter || filter(child)) {
        yield child;
        yield* child.children.dfs(filter);
      }
    }
  }

  /**
   * Depth of the component tree (0 at this node).
   */
  computeMaxDepth() {
    let d = 0;
    for (const child of this.components) {
      d = Math.max(d + 1, child.children.computeMaxDepth());
    }
    return d;
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