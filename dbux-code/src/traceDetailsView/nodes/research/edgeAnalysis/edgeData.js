import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import Enum from '@dbux/common/src/util/Enum';
import size from 'lodash/size';
import { getCurrentResearch } from '../../../../research/Research';


/** ###########################################################################
 * EdgeTypeCount
 * ##########################################################################*/
export const ETC = {
  C: 0,  // Chains
  F: 1,  // Forks
  O: 2,  // Orphans
  TT: 3, // Total Threads
  MC: 4,
  /**
   * Sync does not work too well yet (since it also qualifies missing CHAINs as sync-against edges (e.g. in sequelize#5)).
   */
  Sync: 5
  // RT: 5, // Real Threads
  // Acc: 6, // Accuracy
  // N: 7,  // Nested count average
};

export const ETCCount = size(ETC);
/**
 * NOTE: we ignore all types beyond this
 */
export const ETCMaxCount = ETC.TT + 1; // (+1 because we start at 0)

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
