/** @typedef {import('../Var').default} Var */

export default class Loop {
  /** @type {number} */
  loopId;
  /**
   * @type {number}
   */
  staticLoopId;
  /**
   * @type {number}
   */
  applicationId;
  /**
   * @type {number}
   */
  contextId;
  /**
   * @type {number}
   */
  startRunId;

  /**
   * @type {Var[]}
   */
  vars;
}