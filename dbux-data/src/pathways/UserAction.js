/** @typedef {import('@dbux/common/src/types/Loc').default} Loc */

export default class UserAction {
  /**
   * @type {number} see: UserActionType.js
   */
  type;

  /**
   * @type {number} event create time
   */
  createdAt;

  /**
   * @type {number} UserActionGroupId
   */
  groupId;

  /**
   * @type {number}
   */
  stepId;

  endTime;

  /**
   * @type {number?}
   */
  traceId;

  /**
   * @type {number?}
   */
  applicationId

  /**
   * @type {string?}
   */
  file;

  /**
   * @type {Loc?}
   */
  range;
}
