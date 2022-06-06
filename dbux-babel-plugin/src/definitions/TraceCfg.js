
/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("@dbux/common/src/types/StaticTrace").default } StaticTrace */
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
   * If given, traceCall will only execute if condition met.
   * @type {AstNode}
   */
  preCondition;

  /**
   * The input {@link AstNode} for the build function.
   */
  targetNode;

  /**
   * The {@link NodePath} to be replaced by instrumentation function.
   * 
   * If `false`, it indicates that instrumentation should build, but not store the `trace` call `AstNode`.
   * (In that case, it can be accessed via `traceCfg.data.resultNode`?)
   * @type {(NodePath | false)?}
   */
  targetPath;

  /**
   * @type {Array.<AstNode>}
   */
  moreTraceCallArgs;

  /**
   * If `true`, move to top of scope, else place in order of instrumentation.
   * @type {boolean}
   */
  hoisted;

  /**
   * If set to `true`, no `tid` variable will be allocated or available.
   * NOTE: By default, a new `tid` variable is allocated in order to allow using the trace at a later point in time.
   * 
   */
  noTidIdentifier;
}

export class TraceCfgData {
  /**
   * The resulting {@link AstNode} produced by `build` function.
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
   * The identifier that carries this trace's `tid`.
   * Not available if {@link TraceCfg#meta#noTidIdentifier} is set to true.
   * 
   * @type {number}
   */
  tidIdentifier;

  /**
   * @type {StaticTrace}
   */
  staticTraceData;

  /**
   * @type {Array.<TraceCfg>}
   */
  inputTraces;

  /**
   * Use this to store context-sensitive configuration logic for generic `build` and `instrument` functions.
   * @type {TraceCfgMeta | null}
   */
  meta;

  /**
   * Use this to store context-sensitive configuration logic and data for specialized `build` and `instrument` functions.
   * Is also sometimes used for storing build results.
   * @type {TraceCfgData | null}
   */
  data;
}

/**
 * NOTE: input traces only need a tidIdentifier which is then added to the final `inputs` array which parttakes in a trace call.
 */
export class InputTrace {
  /**
   * @type {number}
   */
  tidIdentifier;
}

export const TraceCfgInput = TraceCfg; // NOTE: the two are very similar
