import { sleep } from 'src/util/sleep';
import isFunction from 'lodash/isFunction';

export default class SerialTaskQueue {
  _pendingSet = new Set();
  _queue = [];
  _donePromise;
  _running;

  // ###########################################################################
  // init
  // ###########################################################################

  constructor(debugTag) {
    this._debugTag = debugTag;

    this._reset();
  }

  _reset() {
    this._donePromise = new Promise(resolve => {
      this._resolveDone = resolve;
    });
  }

  // ###########################################################################
  // public getters
  // ###########################################################################

  /**
   * Amount of pending elements
   */
  get length() {
    return this._pendingSet.size;
  }

  isEmpty() {
    return !this.length;
  }

  isBusy() {
    return this._running;
  }

  // ###########################################################################
  // queue methods
  // ###########################################################################

  enqueue(...cbs) {
    return Promise.all(cbs.map(cb => this._enqueueOne(cb)));
  }

  enqueueWithPriority(priority, ...cbs) {
    return Promise.all(cbs.map(cb => this._enqueueOne(cb, priority)));
  }

  /**
   * Enqueue only if the given callback is not already enqueued.
   * WARNING: Does not work with inline functions. Must be pre-defined functions, or else identity check cannot succeed.
   */
  enqueueIfNotInQueue(priority, cb) {
    if (this._pendingSet.has(cb)) {
      return;
    }
    this._enqueueOne(cb, priority);
  }

  // ###########################################################################
  // misc public methods
  // ###########################################################################


  /**
   * Wait until queue is empty.
   * Multiple calls to `waitUntilFinished` will resolve in the order they came in.
   */
  async waitUntilFinished() {
    this._donePromise = this._donePromise.then(() => {
      // add no-op to ensure that calls to `waitUntilFinished` are resolved in FIFO order
    });
    await this._donePromise;
  }

  // ###########################################################################
  // enqueue (private)
  // ###########################################################################

  /**
   * Enqueue a callback
   */
  _enqueueOne(cb, priority = 0) {
    this._debugTag && this._log(this._debugTag, 'add', cb.name, priority);
    if (!this._running) {
      this._running = true;
      setTimeout(this._run);
    }
    // console.debug('> task', cb.name);
    return new Promise((resolve, reject) => {
      const wrappedCb = async () => {
        try {
          // execute task
          const res = await cb();

          // resolve
          resolve(res);
        }
        catch (err) {
          reject(err);
        }
      };

      wrappedCb.__priority = priority; // hackfix
      wrappedCb.__name = cb.name;

      this._addCb(wrappedCb);
    });
  }

  // async enqueueWhenFinished(cb) {
  //   return this._donePromise = this._donePromise.then(() => {
  //     return this.enqueue(cb);
  //   });
  // }

  _addCb(cb) {
    this._queue.push(cb);
    this._pendingSet.add(cb);
    // return this._promiseChain = this._promiseChain.then(cb);
  }

  // ###########################################################################
  // run
  // ###########################################################################

  _run = async () => {
    this._running = true;
    try {
      while (!this.isEmpty()) {
        // make sure, higher priority items come before lower piority items
        this._queue.sort((a, b) => {
          // hackfix
          const ap = a.__priority;
          const bp = b.__priority;

          return bp - ap;
        });

        // dequeue next task
        const cb = this._queue.shift();
        this._debugTag && this._log(this._debugTag, 'run', cb.__name, cb.__priority);
        this._pendingSet.delete(cb);

        // execute task
        await cb();
      }
    }
    finally {
      this._reset();
      this._running = false;
      this._resolveDone();
    }
  }

  _log(...args) {
    console.debug(...args);
  }

  // ###########################################################################
  // synchronized
  // ###########################################################################

  synchronizedMethods(obj, ...methodNames) {
    for (const methodName of methodNames) {
      let method = obj[methodName];
      if (!isFunction(method)) {
        throw new Error(`invalid methodName ${methodName} in obj ${obj}`);
      }
      method = method.bind(obj);
      obj[methodName] = this.synchronizedFunction(method);
    }
  }

  /**
   * Takes given function and returns a new function that is wrapped s.t.
   * when called, it adds itself as task and executes synchronously with this queue.
   * Returns a promise that is resolved once it has finished execution with it's original return value.
   */
  synchronizedFunction(cb) {
    return async function synchronized(...args) {
      const bound = cb.bind(this, ...args);
      return this.enqueue(bound);
    };
  }
}