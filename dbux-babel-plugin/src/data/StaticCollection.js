export default class StaticCollection {
  _all = [];

  constructor(state) {
    this.state = state;
  }

  getById(id) {
    return this._all[id - 1];
  }

  checkPath(path) {
    if (!path.node.loc) {
      const msg = 'trying to instrument an already instrumented node: ' + path;
      throw new Error(msg);
    }
  }

  _getNextId() {
    return this._all.length + 1;
  }

  _push(entry) {
    this._all.push(entry);
  }
}