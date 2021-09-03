/**
 * A link between two promises.
 * A link implies: settling `from` also settles `to` (possibly off by one tick due to A+).
 * 
 * Examples of links:
 * 
 * `to = Promise.resolve(from)`
 * `to = new Promise(r => ... r(from))`
 * `to = ...then(() => { return from; })`
 * `to = (async () => from)()`
 */
export default class PromiseLink {
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
}