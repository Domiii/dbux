
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

export default class DDGSummarizer {
  /**
   * @type {DataDependencyGraph}
   */
  ddg;

  summaryModes = {};

  constructor(ddg) {
    this.ddg = ddg;
  }

  setSummaryMode(timelineId, mode) {
    this.summaryModes[timelineId] = mode;
  }
}
