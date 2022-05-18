import StaticDataNode from './StaticDataNode';

/** @typedef {import('./Loc').default} Loc */


export default class StaticTrace {
  /**
   * @type {number}
   */
  staticTraceId;
  /**
   * @type {number}
   */
  staticContextId;
  /**
   * @type {number}
   */
  type;
  /**
   * @type {Loc}
   */
  loc;
  
  /**
   * @type {string}
   */
  displayName;

  /**
   * @type {StaticDataNode}
   */
  dataNode;

  /**
   * Determines which branch decision staticTrace controls this staticTrace.
   * 
   * If controlId === staticTraceId (in Post): this itself is a decision trace.
   * 
   * TODO: determine which path was taken (i.e. `if` or `else` etc.)
   * 
   * Runtime: `inProgramStaticTraceId`
   * Post: `staticTraceId`
   * 
   * @type {number}
   */
  controlId;

  /**
   * The id of the whole block.
   * E.g. the if/else block when inside an if or an else.
   * E.g. the switch/case block when inside a case.
   * 
   * NOTE: `else if` is not a syntax element. It is actually nested `if/else`s.
   * 
   * Runtime: `inProgramStaticTraceId`
   * Post: `staticTraceId`
   * 
   * @type {number}
   */
  controlBlockId;

  /**
   * Other data.
   * Currently used by:
   * * `ME`: `{ optional }`
   * * `BCE`: `{ argConfigs }`
   * * `ReferencedIdentifier`: `{ specialType }`
   */
  data;
}