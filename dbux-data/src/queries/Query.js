export default class Query {
  constructor(name, cfg) {
    this.name = name;
    this.cfg = cfg || {};
  }

  _init(/* dp */) {}

  executor = (dp, args) => this.execute(dp, args);

  execute() {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.execute`);
  }
}