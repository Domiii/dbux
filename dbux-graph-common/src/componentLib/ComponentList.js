import pull from 'lodash/pull';
import isString from 'lodash/isString';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

/** @typedef { import("./ComponentEndpoint").default } ComponentEndpoint */


/**
 * @template {ComponentEndpoint} C
 */
export default class ComponentList {
  /**
   * @type {C[]}
   */
  components = [];
  /**
   * @type {Map.<string, C>}
   */
  componentsByName = new Map();
  /**
   * @type {C}
   */
  _owner;

  constructor(owner, roleName) {
    this._owner = owner;
    this._roleName = roleName;
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get length() {
    return this.components.length;
  }

  /**
   * @return {C | null}
   */
  getComponent(Clazz) {
    if (isString(Clazz)) {
      return this.componentsByName.get(Clazz)?.[0] || null;
    }
    if (!Clazz._componentName) {
      throw new Error(`Invalid component class. Did you forget to add this component to _hostRegistry? - ${Clazz}`);
    }
    return this.componentsByName.get(Clazz._componentName)?.[0] || null;
  }

  /**
   * @return {C[]}
   */
  getComponents(Clazz) {
    let name;
    if (isString(Clazz)) {
      name = Clazz;
    }
    else {
      if (!Clazz._componentName) {
        throw new Error(`[INTERNAL ERROR] Invalid component class. Did you forget to add this component to _hostRegistry? - ${Clazz}`);
      }
      name = Clazz._componentName;
    }
    return [...(this.componentsByName.get(name) || EmptyArray)];
  }

  /**
   * @return {C[]}
   */
  getComponentsRef(Clazz) {
    if (isString(Clazz)) {
      return this.componentsByName.get(Clazz) || null;
    }
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

  /**
   * Iterate over entire component sub tree in DFS order.
   */
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
      d = Math.max(d, child.children.computeMaxDepth() + 1);
    }
    return d;
  }

  // moveComponent(comp) {
  //   if (comp.parent === this._owner) {
  //     // don't use this for adding stuff (that's more complicated)
  //     throw new Error(`Invalid use of moveComponent. Must have a different previous owner.`);
  //   }
  //   // NYI
  // }

  // ###########################################################################
  // protected methods
  // ###########################################################################

  /**
   * @param {C} comp
   */
  _addComponent(comp) {
    const Clazz = comp.constructor;
    const name = Clazz._componentName;

    this.components.push(comp);
    let byName = this.getComponentsRef(Clazz);
    if (!byName) {
      this.componentsByName.set(name, byName = []);
    }
    byName.push(comp);
  }

  /**
   * NOTE: Do not call `_removeComponent` directly.
   * Call `unwantedComponent.dispose()` instead.
   */
  _removeComponent(comp) {
    const Clazz = comp.constructor;

    pull(this.components, comp);

    let byName = this.getComponentsRef(Clazz);
    pull(byName, comp);
  }
}