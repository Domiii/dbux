import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let dDGSummaryModeConfig = {
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
   * Expand only the node itself. Collapse all children.
   */
  ExpandSelf: 6,

  /**
   * ExpandSelf + 1 level.
   * Group nodes only.
   * Expand the node and all direct children. Collapse all deeper descendants.
   */
  ExpandSelf1: 7,

  /**
   * ExpandSelf + 2 levels.
   * Group nodes only.
   * Expand the node and all direct children and children's children. Collapse all deeper descendants.
   */
  ExpandSelf2: 8,
  ExpandSelf3: 9,
  ExpandSelf4: 10,
  /**
   * Group nodes only.
   * Expand the node and all its descendants.
   */
  ExpandSubgraph: 15,
  /**
   * Root node only.
   * This will hide everything, except for watched nodes.
   */
  HideChildren: 16
};

/**
 * @type {(Enum|typeof dDGSummaryModeConfig)}
 */
const DDGSummaryMode = new Enum(dDGSummaryModeConfig);

/**
 * SummaryModes that are available to root.
 */
export const RootSummaryModes = [
  DDGSummaryMode.HideChildren,
  DDGSummaryMode.ExpandSelf,
  DDGSummaryMode.ExpandSelf1,
  DDGSummaryMode.ExpandSelf2,
  DDGSummaryMode.ExpandSelf3,
  DDGSummaryMode.ExpandSelf4,
  DDGSummaryMode.ExpandSubgraph
];

export const GroupDefaultSummaryModes = [
  DDGSummaryMode.CollapseSummary,
  DDGSummaryMode.ExpandSelf,
  DDGSummaryMode.ExpandSelf1,
  DDGSummaryMode.ExpandSelf2,
  DDGSummaryMode.ExpandSelf3,
  DDGSummaryMode.ExpandSelf4,
  DDGSummaryMode.ExpandSubgraph
];

const shallowSummaryModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
shallowSummaryModes[DDGSummaryMode.ExpandSelf1] = true;
shallowSummaryModes[DDGSummaryMode.ExpandSelf2] = true;
shallowSummaryModes[DDGSummaryMode.ExpandSelf3] = true;
shallowSummaryModes[DDGSummaryMode.ExpandSelf4] = true;
export function isShallowSummaryMode(mode) {
  return shallowSummaryModes[mode] || false;
}

const shownModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
shownModes[DDGSummaryMode.Show] = true;
shownModes[DDGSummaryMode.ExpandSelf] = true;
shownModes[DDGSummaryMode.ExpandSelf1] = true;
shownModes[DDGSummaryMode.ExpandSelf2] = true;
shownModes[DDGSummaryMode.ExpandSelf3] = true;
shownModes[DDGSummaryMode.ExpandSelf4] = true;
shownModes[DDGSummaryMode.ExpandSubgraph] = true;
shownModes[DDGSummaryMode.CollapseSummary] = true;
shownModes[DDGSummaryMode.HideChildren] = true;
export function isShownMode(mode) {
  return shownModes[mode] || false;
}

const collapsedModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
collapsedModes[DDGSummaryMode.CollapseSummary] = true;
export function isCollapsedMode(mode) {
  return collapsedModes[mode] || false;
}

const expandedModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
expandedModes[DDGSummaryMode.ExpandSelf] = true;
expandedModes[DDGSummaryMode.ExpandSelf1] = true;
expandedModes[DDGSummaryMode.ExpandSelf2] = true;
expandedModes[DDGSummaryMode.ExpandSelf3] = true;
expandedModes[DDGSummaryMode.ExpandSelf4] = true;
expandedModes[DDGSummaryMode.ExpandSubgraph] = true;
expandedModes[DDGSummaryMode.HideChildren] = true;
export function isExpandedMode(mode) {
  return expandedModes[mode] || false;
}

const shallowExpandedModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
/**
 * NOTE: ExpandSelf is shallow summary, and can nest visible CollapseSummary nodes
 */
shallowExpandedModes[DDGSummaryMode.ExpandSelf] = true;
shallowExpandedModes[DDGSummaryMode.ExpandSelf1] = true;
shallowExpandedModes[DDGSummaryMode.ExpandSelf2] = true;
shallowExpandedModes[DDGSummaryMode.ExpandSelf3] = true;
shallowExpandedModes[DDGSummaryMode.ExpandSelf4] = true;
export function isShallowExpandedMode(mode) {
  return shallowExpandedModes[mode] || false;
}

const hasSummaryDataModes = new Array(DDGSummaryMode.getValueMaxIndex()).map(() => false);
hasSummaryDataModes[DDGSummaryMode.CollapseSummary] = true;
hasSummaryDataModes[DDGSummaryMode.ExpandSelf] = true;
hasSummaryDataModes[DDGSummaryMode.ExpandSelf1] = true;
hasSummaryDataModes[DDGSummaryMode.ExpandSelf2] = true;
hasSummaryDataModes[DDGSummaryMode.ExpandSelf3] = true;
hasSummaryDataModes[DDGSummaryMode.ExpandSelf4] = true;
export function isSummaryMode(mode) {
  return hasSummaryDataModes[mode] || false;
}

export default DDGSummaryMode;
