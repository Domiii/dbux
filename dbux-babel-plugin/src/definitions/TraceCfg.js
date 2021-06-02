
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("../parse/BaseNode").default } BaseNode */

export default class TraceCfg {
  /**
   * @type {NodePath}
   */
  path;

  /**
   * @type {BaseNode}
   */
  node;
  /**
   * @type {number}
   */
  inProgramStaticTraceId;
  /**
   * @type {number}
   */
  tidIdentifier;
  /**
   * @type {number}
   */
  declarationTidIdentifier;

  /**
   * @type {Array.<TraceCfg>}
   */
  inputTraces;

  /**
   * @type {object | null}
   */
  meta;

  /**
   * @type {object | null}
   */
  data;
}