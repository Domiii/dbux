import Ipc from './Ipc';
import RemoteCommandProxy from './RemoteCommandProxy';

class GraphBase {
  constructor() {
  }

  startIpc(ipcAdapter) {
    const { commands } = this;
    this.ipc = new Ipc(ipcAdapter, commands);
    this.remote = new RemoteCommandProxy(this.ipc);
    // this.ipc.init(this._handleMessage);
  }
}

export default GraphBase;