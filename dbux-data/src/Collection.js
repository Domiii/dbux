export default class Collection {
  name;
  dp;
  _all = [null];

  constructor(name, dp) {
    this.name = name;
    this.dp = dp;
  }

  add(entries) {
    this._all.push(...entries);
  }

  getAll() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }
}