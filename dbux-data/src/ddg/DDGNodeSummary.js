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
  varNodesByDeclarationTid;


  /**
   * Set of {@link RefSnapshotTimelineNode#timelineId} 
   * @type {Array.<number>}
   */
  summaryRoots;

  constructor(timelineId, snapshotsByRefId, varNodesByDeclarationTid, summaryRoots) {
    this.timelineId = timelineId;
    this.snapshotsByRefId = snapshotsByRefId;
    this.varNodesByDeclarationTid = varNodesByDeclarationTid;
    this.summaryRoots = summaryRoots;
  }
}