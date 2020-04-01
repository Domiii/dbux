class RemoteCommandProxy {
  _cachedCallbacks = {};

  constructor(ipc) {
    // neat little hackfix - see: https://stackoverflow.com/a/40714458
    return new Proxy(this, {
      get: (_this, commandName) => {
        let cb = this._cachedCallbacks[commandName];
        if (!cb) {
          // create new cb
          cb = async (...args) => {
            const result = await ipc.sendMessage(commandName, args);
            return result;
          };
          this._cachedCallbacks[commandName] = cb;
        }
        
        return cb;
      }
    });
  }
}

export default RemoteCommandProxy;