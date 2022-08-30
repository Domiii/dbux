import PromiseLinkType from './constants/PromiseLinkType';

/**
 * A link between two promises.
 * A link implies: settling `from` also settles `to` (possibly off by one tick due to A+).
 * Also: `from` is nested, `to` is nesting (or "nester").
 * Also: `from` is "inner", `to` is "outer".
 * 
 * Examples:
 * 
 * `to = Promise.resolve(from)`
 * `to = new Promise(r => ... r(from))`
 * `to = ...then(() => from)`
 * `to = (async () => from)()`
 */
export default class PromiseLink {
  linkId;
  
  /**
   * @type {PromiseLinkType[keyof PromiseLinkType]}
   */
  type;

  /**
   * Promise id of the `nestingPromise`
   * 
   * @type {number}
   */
  from;

  /**
   * Promise id of the promise that nests `from`
   * 
   * @type {number}
   */
  to;

  /**
   * The trace that created the link
   */
  traceId;

  rootId;

  /**
   * @type {number}
   *
   * Only used for promisification via promise ctors.
   * The promiseId that the `resolve` call is "tethered" to.
   * NOTE: This is only set if `resolve` was called asynchronously.
   * NOTE2: There might be no recorded root when this function is called (e.g. `setTimeout(resolve)`).
   */
  asyncPromisifyPromiseId;
}