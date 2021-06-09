
/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("../parse/BaseNode").default } BaseNode */

export class TraceCfgMeta {
  /**
   * @type {String?}
   */
  traceCall;
  /**
   * @type {Function?}
   */
  build;
  /**
   * @type {Function?}
   */
  instrument;
  /**
   * @type {Array.<AstNode>}
   */
  moreTraceCallArgs;

  /**
   * If `false`, it indicates that instrumentation should build, but not store the `trace` call `AstNode`.
   * In that case, it can be accessed via `traceCfg.data.resultNode`
   * @type {(NodePath | false)?}
   */
  replacePath;
}

export class TraceCfgData {
  /**
   * @type {AstNode | undefined}
   */
  resultNode;
}


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
   * @type {TraceCfgMeta | null}
   */
  meta;

  /**
   * This is mostly used to store custom context-sensitive per-trace data.
   * But it is also used for storing results.
   * @type {TraceCfgData | null}
   */
  data;
}