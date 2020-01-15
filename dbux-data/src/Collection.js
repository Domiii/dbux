export default class Collection {
  name;
  dp;
  _all = [null];

  constructor(name, dp) {
    this.name = name;
    this.dp = dp;
  }

  getAll() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }
}