
/**
 * @param {Ipc} ipc
 */
async function remoteCommandCb(ipc, componentId, commandName, ...args) {
  const result = await ipc.sendMessage(componentId, commandName, args);
  return result;
}

class RemoteCommandProxy {
  constructor(ipc, componentId, propName = 'public') {
    const _cachedCallbacks = {};

    // neat little hackfix - see: https://stackoverflow.com/a/40714458
    return new Proxy(this, {
      get: (_this, commandName) => {
        const realCommandName = `${propName}.${commandName}`;
        let cb = _cachedCallbacks[realCommandName];
        if (!cb) {
          // create new cb
          cb = remoteCommandCb.bind(this, ipc, componentId, realCommandName);
          _cachedCallbacks[realCommandName] = cb;
        }

        return cb;
      }
    });
  }
}

export default RemoteCommandProxy;