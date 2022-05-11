/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

// import DDGSelectedSet from './DDGSelectedSet';
import DDGTimeline from './DDGTimeline';

export default class DataDependencyGraph {
  // /**
  //  * @type {DDGSelectedSet}
  //  */
  // selectedSet;

  writeNodes;

  edges;

  /**
   * @type {string}
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
    // this.selectedSet = inputNodes;
    // this.selectedSet = new DDGSelectedSet(this, inputNodes);
    this.timeline = new DDGTimeline(this, inputNodes);
  }
}
