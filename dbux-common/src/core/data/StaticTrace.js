import StaticDataNode from './StaticDataNode';

/** @typedef {import('../Loc').default} Loc */


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
}