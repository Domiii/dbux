import ParsePlugin from '../../parseLib/ParsePlugin';

/** @typedef { import("../BaseNode").default } BaseNode */



/**
 * Custom layer on top of generic {@link ParsePlugin}.
 */
export default class BasePlugin extends ParsePlugin {
  /**
   * @type {BaseNode}
   */
  node;
}