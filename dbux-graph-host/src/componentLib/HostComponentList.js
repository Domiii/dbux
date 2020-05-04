import pull from 'lodash/pull';
import isString from 'lodash/isString';

class HostComponentList {
  components = [];
  componentsByName = new Map();

  constructor(parent) {
    this.parent = parent;
  }

  // ###########################################################################
  // getter
  // ###########################################################################

  get length() {
    return this.components.length;
  }

  getComponent(Clazz) {
    if (!Clazz._componentName) {
      throw new Error(`Invalid component class. Did you forget to add this component to _hostRegistry? - ${Clazz}`);
    }
    return this.componentsByName.get(Clazz._componentName)?.[0] || null;
  }

  getComponents(Clazz) {
    if (!Clazz._componentName) {
      throw new Error(`Invalid component class. Did you forget to add this component to _hostRegistry? - ${Clazz}`);
    }
    return this.componentsByName.get(Clazz._componentName) || null;
  }

  // ###########################################################################
  // iterators
  // ###########################################################################

  * [Symbol.iterator]() {
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
    // get component class + name
    const { componentRegistry } = this.parent.componentManager;
    let Clazz;
    let name;
    if (isString(ComponentClassOrName)) {
      name = ComponentClassOrName;
      Clazz = componentRegistry[name];
    }
    else {
      Clazz = ComponentClassOrName;
      name = Clazz._componentName;
    }

    // create + store
    const comp = this.parent.componentManager._createComponent(this.parent, Clazz, initialState);
    this.components.push(comp);
    let byName = this.getComponents(Clazz);
    if (!byName) {
      this.componentsByName.set(name, byName = []);
    }
    byName.push(comp);

    // return
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
  _removeComponent(comp) {
    pull(this.components, comp);

    let byName = this.getComponents(comp.constructor);
    pull(byName, comp);
  }
}

export default HostComponentList;