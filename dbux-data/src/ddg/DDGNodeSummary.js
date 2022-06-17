/** @typedef { import("./DDGTimelineNodes").RefSnapshotTimelineNode } RefSnapshotTimelineNode */
/** @typedef { Map.<number, number> } SnapshotMap */

export default class DDGNodeSummary {
  timelineId;

  /**
   * @type {SnapshotMap}
   */
  snapshotsByRefId;

  /**
   * @type {Map.<number, number>}
   */
  nodesByTid;


  /**
   * Set of {@link RefSnapshotTimelineNode#timelineId} 
   * @type {Array.<number>}
   */
  summaryRoots;

  constructor(timelineId, snapshotsByRefId, nodesByTid, summaryRoots) {
    this.timelineId = timelineId;
    this.snapshotsByRefId = snapshotsByRefId;
    this.nodesByTid = nodesByTid;
    this.summaryRoots = summaryRoots;
  }
}