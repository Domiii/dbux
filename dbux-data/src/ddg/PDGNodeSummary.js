/** @typedef { import("./PDGTimelineNodes").RefSnapshotTimelineNode } RefSnapshotTimelineNode */
/** @typedef { Map.<number, number> } SnapshotMap */

export default class PDGNodeSummary {
  timelineId;

  /**
   * TODO: this currently not only contains Snapshots but also reference-typed Snapshot Value children 
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

  /**
   * Whether this summary has nested summaries.
   * If true, it means that this is a shallow summary that has visible descendant summaries.
   */
  hasNestedSummaries = false;

  constructor(timelineId, snapshotsByRefId, nodesByTid, summaryRoots) {
    this.timelineId = timelineId;
    this.snapshotsByRefId = snapshotsByRefId;
    this.nodesByTid = nodesByTid;
    this.summaryRoots = summaryRoots;
  }
}