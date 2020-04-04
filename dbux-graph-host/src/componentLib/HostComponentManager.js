import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';

class HostComponentManager extends BaseComponentManager {
  static create(ipcAdapter) {
    const manager = new HostComponentManager();
    manager.start(ipcAdapter);
    return manager;
  }
}

export default HostComponentManager;