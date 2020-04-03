import Ipc from './componentLib/Ipc';
import RemoteCommandProxy from './RemoteCommandProxy';
import ComponentEndpoint from './componentLib/ComponentEndpoint';

class GraphBase {
  startIpc(ipcAdapter) {
    const { commands } = this;
    this.remote = new RemoteCommandProxy(this.ipc, this.componentId);
    // this.ipc.init(this._handleMessage);
  }
}

export default GraphBase;