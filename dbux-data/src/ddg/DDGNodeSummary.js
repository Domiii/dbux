
export default class DDGNodeSummary {
  timelineId;

  /**
   * Set of `timelineId`s of {@link RefSnapshotTimelineNode} 
   * @type {Array.<number>}
   */
  summaryNodes;

  constructor(timelineId, summaryNodes) {
    this.timelineId = timelineId;
    this.summaryNodes = summaryNodes;
  }
}