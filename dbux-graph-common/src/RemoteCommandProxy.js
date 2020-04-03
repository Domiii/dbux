import Ipc from './componentLib/Ipc';

/**
 * @param {Ipc} ipc
 */
async function remoteCommandCb(ipc, componentId, commandName, ...args) {
  const result = await ipc.sendMessage(componentId, commandName, args);
  return result;
}

class RemoteCommandProxy {
  constructor(ipc, componentId) {
    const _cachedCallbacks = {};

    // neat little hackfix - see: https://stackoverflow.com/a/40714458
    return new Proxy(this, {
      get: (_this, commandName) => {
        let cb = _cachedCallbacks[commandName];
        if (!cb) {
          // create new cb
          cb = remoteCommandCb.bind(this, ipc, componentId, commandName);
          this._cachedCallbacks[commandName] = cb;
        }

        return cb;
      }
    });
  }
}

export default RemoteCommandProxy;