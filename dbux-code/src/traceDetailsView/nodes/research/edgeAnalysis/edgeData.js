import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import Enum from '@dbux/common/src/util/Enum';
import { getCurrentResearch } from '../../../../research/Research';


/** ###########################################################################
 * EdgeTypeCount
 * ##########################################################################*/
export const ETC = {
  C: 0,  // Chain
  F: 1,  // Fork + Multi-Chain
  O: 2,  // Orphan
  TT: 3, // Total Threads
  RT: 4, // Real Threads
  Acc: 5, // Accuracy
  N: 6,  // Nested count average
};

/** ###########################################################################
 * EdgeStatus
 * ##########################################################################*/

const edgeStatusObj = {
  Normal: 1,
  TimelineStart: 2,

  /** ########################################
   * false timelines (forks)
   * #######################################*/

  PromiseNotNested: 3,
  CBPromisified: 4,
  CB: 5,

  /** ########################################
   * false timelines (other)
   * #######################################*/
  /**
   * Chained, but skipped one or more in chain, usually resulting in unwanted multi chain
   * that should be a single chain.
   */
  MultiChain: 11
};

/**
 * @type {Enum | typeof edgeStatusObj}
 */
export const EdgeStatus = new Enum(edgeStatusObj);

const EdgeDataFileName = 'edgeAnnotations.json';


export function getExperimentDataFilePath(experimentId) {
  const root = getCurrentResearch().getExperimentFolder(experimentId);
  return pathResolve(root, EdgeDataFileName);
}
