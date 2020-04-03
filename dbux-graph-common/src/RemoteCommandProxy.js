import Ipc from './Ipc';

/**
 * @param {Ipc} ipc
 */
async function remoteCommandCb(ipc, commandName, ...args) {
  const result = await ipc.sendMessage(commandName, args);
  return result;
}

class RemoteCommandProxy {
  _cachedCallbacks = {};

  constructor(ipc) {
    // neat little hackfix - see: https://stackoverflow.com/a/40714458
    return new Proxy(this, {
      get: (_this, commandName) => {
        let cb = this._cachedCallbacks[commandName];
        if (!cb) {
          // create new cb
          cb = remoteCommandCb.bind(this, ipc, commandName);
          this._cachedCallbacks[commandName] = cb;
        }

        return cb;
      }
    });
  }
}

export default RemoteCommandProxy;