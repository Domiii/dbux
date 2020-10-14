export default class UserAction {
  /**
   * @type {number} see: UserActionType.js
   */
  type;

  /**
   * @type {string} uuid of PracticeSession
   */
  sessionId;

  /**
   * @type {string}
   */
  bugId;

  /**
   * @type {number} event create time
   */
  createdAt;

  /**
   * @type {Object} event data, contents depends on type
   */
  data;
}