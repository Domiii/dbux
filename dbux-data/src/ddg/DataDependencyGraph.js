/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

// import DDGWatchSet from './DDGWatchSet';
import DDGTimeline from './DDGTimeline';
import DDGBounds from './DDGBounds';

export default class DataDependencyGraph {
  // /**
  //  * @type {DDGWatchSet}
  //  */
  // selectedSet;
  /**
   * @type {string}
   */
  id;

  /**
   * @type {RuntimeDataProvider}
   */
  dp;

  /**
   * @type {DDGWatchSet}
   */
  watchSet;

  /**
   * @type {DDGBounds}
   */
  bounds;

  // edges;


  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp) {
    this.dp = dp;
  }

  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    // this.selectedSet = new DDGWatchSet(this, inputNodes);
    this.bounds = new DDGBounds(watchTraceIds);
    this.timeline = new DDGTimeline(this, watchTraceIds);
  }
}
