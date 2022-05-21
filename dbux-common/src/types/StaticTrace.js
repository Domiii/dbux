import StaticDataNode from './StaticDataNode';

/** @typedef {import('./Loc').default} Loc */


export default class StaticTrace {
  /**
   * WARN: only available during instrumentation.
   */
  _traceId;

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
   * The branch decision staticTrace that controls this staticTrace.
   * 
   * If controlId === staticTraceId (in Post): this itself is a decision trace.
   * 
   * Runtime: `inProgramStaticTraceId`
   * Post: `staticTraceId`
   * 
   * @type {number}
   */
  controlRole;

  /**
   * If this trace is a control statement's push trace, then `controlId` is the
   * statement's own `staticTraceId`.
   * 
   * @type {number}
   */
  controlId;

  /**
   * Other data.
   * Currently used by:
   * * `ME`: `{ optional }`
   * * `BCE`: `{ argConfigs }`
   * * `ReferencedIdentifier`: `{ specialType }`
   */
  data;
}