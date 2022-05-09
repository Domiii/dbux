/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

import DDGSelectedSet from './DDGSelectedSet';

export default class DataDependencyGraph {
  /**
   * @type {DDGSelectedSet}
   */
  selectedSet;

  writeNodes;

  edges;

  /**
   * @type {number}
   */
  id;

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp) {
    this.dp = dp;
  }

  build(inputNodes) {
    this.selectedSet = new DDGSelectedSet(this, inputNodes);
  }
}
