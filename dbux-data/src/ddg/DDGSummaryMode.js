import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DDGSummaryModeConfig = {
  /**
   * Non-group (plain) nodes only.
   * Show this node.
   */
  Show: 1,
  /**
   * Don't show this node.
   */
  Hide: 2,
  /**
   * Group nodes only.
   * Collapse node and its subgraph to a single node.
   */
  Collapse: 3,
  /**
   * Group nodes only.
   * Collapse node and its subgraph to a summarizing subgraph.
   */
  CollapseSummary: 4,
  /**
   * Group nodes only.
   * Expand the node, but only one level deep. Collapse all children.
   */
  ExpandSelf: 5,
  /**
   * Group nodes only.
   * Expand the node and all its descendants.
   */
  ExpandSubgraph: 6,
  /**
   * Root node only.
   * This will hide everything, except for watched nodes.
   */
  HideChildren: 7
};

/**
 * @type {(Enum|typeof DDGSummaryModeConfig)}
 */
const DDGSummaryMode = new Enum(DDGSummaryModeConfig);

/**
 * SummaryModes that are available to root.
 */
export const RootSummaryModes = [
  DDGSummaryMode.HideChildren,
  DDGSummaryMode.ExpandSelf,
  DDGSummaryMode.ExpandSubgraph
];


const shownModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
shownModes[DDGSummaryMode.Show] = true;
shownModes[DDGSummaryMode.Collapse] = true;
shownModes[DDGSummaryMode.CollapseSummary] = true;
shownModes[DDGSummaryMode.ExpandSelf] = true;
shownModes[DDGSummaryMode.ExpandSubgraph] = true;
shownModes[DDGSummaryMode.HideChildren] = true;
export function isShownMode(mode) {
  return shownModes[mode] || false;
}

const collapsedModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
collapsedModes[DDGSummaryMode.Collapse] = true;
collapsedModes[DDGSummaryMode.CollapseSummary] = true;
export function isCollapsedMode(mode) {
  return collapsedModes[mode] || false;
}

export default DDGSummaryMode;
