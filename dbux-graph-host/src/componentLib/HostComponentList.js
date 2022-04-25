import isString from 'lodash/isString';

import ComponentList from '@dbux/graph-common/src/componentLib/ComponentList';

/** @typedef { import("./HostComponentEndpoint").default } HostComponentEndpoint */
/** @typedef { import("./HostComponentManager").default } HostComponentManager */

/**
 * @extends {ComponentList<HostComponentEndpoint>}
 */
class HostComponentList extends ComponentList {
  // ###########################################################################
  // public methods
  // ###########################################################################

  get componentManager() {
    return this._owner.componentManager;
  }

  createComponent(ComponentClassOrName, initialState, hostOnlyState) {
    // get component class + name
    const { componentRegistry } = this.componentManager;
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
    const comp = this.componentManager._createComponent(this._owner, Clazz, initialState, hostOnlyState);
    comp._internalRoleName = this._roleName;
    this._addComponent(comp);

    // return
    return comp;
  }

  clear(silent = false) {
    for (let i = this.components.length - 1; i >= 0; --i) {
      this.components[i].dispose(silent);
    }
  }
}

export default HostComponentList;