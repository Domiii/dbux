export default class StaticCollection {
  _all = [null];

  constructor(state) {
    this.state = state;
  }

  checkPath(path) {
    if (!path.node.loc) {
      const msg = 'trying to instrument an already instrumented node: ' + path;
      throw new Error(msg);
    }
  }
  
  getNextId() {
    return this._all.length;
  }

  _push(entry) {
    this._all.push(entry);
  }
}