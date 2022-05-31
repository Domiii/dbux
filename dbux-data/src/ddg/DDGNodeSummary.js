/** @typedef { import("./DDGTimelineNodes").RefSnapshotTimelineNode } RefSnapshotTimelineNode */
/** @typedef { Map.<number, RefSnapshotTimelineNode } SnapshotMap */

export default class DDGNodeSummary {
  timelineId;

  /**
   * @type {SnapshotMap}
   */
  snapshotsByRefId;

  /**
   * Set of `timelineId`s of {@link RefSnapshotTimelineNode} 
   * @type {Array.<number>}
   */
  summaryNodes;

  constructor(timelineId, snapshotsByRefId, summaryNodes) {
    this.timelineId = timelineId;
    this.snapshotsByRefId = snapshotsByRefId;
    this.summaryNodes = summaryNodes;
  }
}