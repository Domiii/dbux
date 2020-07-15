import isString from 'lodash/isString';

import ComponentList from '@dbux/graph-common/src/componentLib/ComponentList';

class HostComponentList extends ComponentList {
  // ###########################################################################
  // public methods
  // ###########################################################################

  createComponent(ComponentClassOrName, initialState) {
    // get component class + name
    const { componentRegistry } = this._owner.componentManager;
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
    const comp = this._owner.componentManager._createComponent(this._owner, Clazz, initialState);
    comp._internalRoleName = this._roleName;
    this._addComponent(comp);

    // return
    return comp;
  }

  clear() {
    for (let i = this.components.length - 1; i >= 0; --i) {
      this.components[i].dispose();
    }
  }
}

export default HostComponentList;