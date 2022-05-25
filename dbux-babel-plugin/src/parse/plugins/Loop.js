import BasePlugin from './BasePlugin';

/** @typedef { import("./BranchStatement").default } BranchStatement */


export default class Loop extends BasePlugin {
  static plugins = [
    'BranchStatement'
  ];

  /**
   * @type {BranchStatement}
   */
  get BranchStatement() {
    return this.getPlugin('BranchStatement');
  }
}
