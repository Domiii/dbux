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
   * Expand the node, but only one level deep. Collapse all children.
   */
  ExpandSelf: 4,
  /**
   * Group nodes only.
   * Expand the node and all its descendants.
   */
  ExpandSubgraph: 5,

  /**
   * Root node only.
   */
  HideChildren: 6
};

/**
 * @type {(Enum|typeof DDGSummaryModeConfig)}
 */
const DDGSummaryMode = new Enum(DDGSummaryModeConfig);

/**
 * SummaryModes that are available to root.
 */
export const RootSummaryModes = [
  DDGSummaryMode.ExpandSelf,
  DDGSummaryMode.ExpandSubgraph,
  DDGSummaryMode.HideChildren
];


const shownModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
shownModes[DDGSummaryMode.Show] = true;
shownModes[DDGSummaryMode.Collapse] = true;
shownModes[DDGSummaryMode.ExpandSelf] = true;
shownModes[DDGSummaryMode.ExpandSubgraph] = true;
shownModes[DDGSummaryMode.HideChildren] = true;
export function isShownMode(mode) {
  return shownModes[mode] || false;
}

const collapsedModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
collapsedModes[DDGSummaryMode.Collapse] = true;
export function isCollapsedMode(mode) {
  return collapsedModes[mode] || false;
}

export default DDGSummaryMode;
