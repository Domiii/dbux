import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let pDGSummaryModeConfig = {
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
 * @type {(Enum|typeof pDGSummaryModeConfig)}
 */
const PDGSummaryMode = new Enum(pDGSummaryModeConfig);

/**
 * SummaryModes that are available to root.
 */
export const RootSummaryModes = [
  PDGSummaryMode.HideChildren,
  PDGSummaryMode.ExpandSelf,
  PDGSummaryMode.ExpandSelf1,
  PDGSummaryMode.ExpandSelf2,
  PDGSummaryMode.ExpandSelf3,
  PDGSummaryMode.ExpandSelf4,
  PDGSummaryMode.ExpandSubgraph
];

export const GroupDefaultSummaryModes = [
  PDGSummaryMode.CollapseSummary,
  PDGSummaryMode.ExpandSelf,
  PDGSummaryMode.ExpandSelf1,
  PDGSummaryMode.ExpandSelf2,
  PDGSummaryMode.ExpandSelf3,
  PDGSummaryMode.ExpandSelf4,
  PDGSummaryMode.ExpandSubgraph
];

const shallowSummaryModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
shallowSummaryModes[PDGSummaryMode.ExpandSelf1] = true;
shallowSummaryModes[PDGSummaryMode.ExpandSelf2] = true;
shallowSummaryModes[PDGSummaryMode.ExpandSelf3] = true;
shallowSummaryModes[PDGSummaryMode.ExpandSelf4] = true;
export function isShallowSummaryMode(mode) {
  return shallowSummaryModes[mode] || false;
}

const shownModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
shownModes[PDGSummaryMode.Show] = true;
shownModes[PDGSummaryMode.ExpandSelf] = true;
shownModes[PDGSummaryMode.ExpandSelf1] = true;
shownModes[PDGSummaryMode.ExpandSelf2] = true;
shownModes[PDGSummaryMode.ExpandSelf3] = true;
shownModes[PDGSummaryMode.ExpandSelf4] = true;
shownModes[PDGSummaryMode.ExpandSubgraph] = true;
shownModes[PDGSummaryMode.CollapseSummary] = true;
shownModes[PDGSummaryMode.HideChildren] = true;
export function isShownMode(mode) {
  return shownModes[mode] || false;
}

const collapsedModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
collapsedModes[PDGSummaryMode.CollapseSummary] = true;
export function isCollapsedMode(mode) {
  return collapsedModes[mode] || false;
}

const expandedModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
expandedModes[PDGSummaryMode.ExpandSelf] = true;
expandedModes[PDGSummaryMode.ExpandSelf1] = true;
expandedModes[PDGSummaryMode.ExpandSelf2] = true;
expandedModes[PDGSummaryMode.ExpandSelf3] = true;
expandedModes[PDGSummaryMode.ExpandSelf4] = true;
expandedModes[PDGSummaryMode.ExpandSubgraph] = true;
expandedModes[PDGSummaryMode.HideChildren] = true;
export function isExpandedMode(mode) {
  return expandedModes[mode] || false;
}

const shallowExpandedModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
/**
 * NOTE: ExpandSelf is shallow summary, and can nest visible CollapseSummary nodes
 */
shallowExpandedModes[PDGSummaryMode.ExpandSelf] = true;
shallowExpandedModes[PDGSummaryMode.ExpandSelf1] = true;
shallowExpandedModes[PDGSummaryMode.ExpandSelf2] = true;
shallowExpandedModes[PDGSummaryMode.ExpandSelf3] = true;
shallowExpandedModes[PDGSummaryMode.ExpandSelf4] = true;
export function isShallowExpandedMode(mode) {
  return shallowExpandedModes[mode] || false;
}

const hasSummaryDataModes = new Array(PDGSummaryMode.getValueMaxIndex()).map(() => false);
hasSummaryDataModes[PDGSummaryMode.CollapseSummary] = true;
hasSummaryDataModes[PDGSummaryMode.ExpandSelf] = true;
hasSummaryDataModes[PDGSummaryMode.ExpandSelf1] = true;
hasSummaryDataModes[PDGSummaryMode.ExpandSelf2] = true;
hasSummaryDataModes[PDGSummaryMode.ExpandSelf3] = true;
hasSummaryDataModes[PDGSummaryMode.ExpandSelf4] = true;
export function isSummaryMode(mode) {
  return hasSummaryDataModes[mode] || false;
}

export default PDGSummaryMode;
