import isFunction from 'lodash/isFunction';
import { newLogger } from 'dbux-common/src/log/logger';
import { isPromise } from '../isPromise';
const { log, debug, warn, error: logError } = newLogger('dbux-code');

const WarnTimeout = 10000;

export default class SerialTaskQueue {
  _pendingSet = new Set();
  _queue = [];
  _donePromise;
  _running;
  _version = 0;

  // ###########################################################################
  // init
  // ###########################################################################

  constructor(debugTag) {
    this._debugTag = debugTag;

    this._reset();
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

  /**
   * Clears all pending (not already executing) tasks.
   */
  clear() {
    this._queue = [];
    this._pendingSet.clear();
  }

  /**
   * Calls `clear()`, and rejects any waiting tasks.
   * NOTE: If there is a currently executing async task, it will keep on going 
   *      (as we cannot cancel blackboxed promises),
   *      but will be detached from the queue.
   * IMPROTANT: You can `await` on cancel to make sure 
   *      not to do anything while the currently active task has not finished yet.
   */
  async cancel() {
    if (!this._running) {
      return;
    }

    this.clear();
    const task = this._activeTask;

    if (this._waitCount) {
      this._rejectWaitQueue(new Error('queue cancelled'));
    }
    else {
      this._resolveWaitQueue();
    }

    await task;
  }


  // ###########################################################################
  // wait queue
  // ###########################################################################

  /**
   * Wait until queue is empty.
   * Multiple calls to `waitUntilFinished` will resolve in the order they came in.
   */
  async waitUntilFinished() {
    ++this._waitCount;
    this._donePromise = this._donePromise.then(() => {
      // add no-op to ensure that calls to `waitUntilFinished` are resolved in FIFO order
    });
    await this._donePromise;
  }

  // ########################################
  // wait queue (private)
  // ########################################

  _reset() {
    this._activeTask = null;
    this._waitCount = 0;
    this._donePromise = new Promise((resolve, reject) => {
      this._resolveDoneCb = resolve;
      this._rejectDoneCb = reject;
    });
  }

  _resolveWaitQueue() {
    this._running = false;
    
    this._resolveDoneCb();
    this._reset();
  }

  _rejectWaitQueue(err) {
    this._running = false;
    ++this._version;
    
    this._rejectDoneCb(err);
    this._reset();
  }

  // ###########################################################################
  // enqueue (private)
  // ###########################################################################

  /**
   * Enqueue a callback
   */
  _enqueueOne(cb, priority = 0) {
    this._debugTag && this._log(this._debugTag, 'add', cb.name, priority);
    this._startRun();

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
      wrappedCb.__name = cb.__name || cb.name;

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

  _startRun() {
    if (this._running) {
      return;
    }

    this._running = true;
    ++this._version;
    setTimeout(this._run);
  }

  _run = async () => {
    const version = this._version;

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

        // watch for timeout
        const startTime = Date.now();
        const timeoutTimer = setInterval(() => {
          warn(`Scheduled task "${cb.__name}" still running (`, ((Date.now() - startTime) / 1000).toFixed(2) + 's)...');
        }, WarnTimeout);

        try {
          // execute task
          const result = cb();
          if (isPromise(result)) {
            this._activeTask = result;
            await result;
          }
        }
        finally {
          clearInterval(timeoutTimer);
          if (this._version === version) {
            // only change queue state, if this is still active
            this._activeTask = null;
          }
        }
      }
      if (this._version === version) {
        this._resolveWaitQueue();
      }
    }
    catch (err) {
      this.clear();
      this._rejectWaitQueue(err);
    }
    // finally {
    // }
  }

  _log(...args) {
    // debug(...args);
  }

  // ###########################################################################
  // synchronized
  // ###########################################################################

  /**
   * TODO: currently calling one synchronized method from another synchronized method causes deadlock
   */
  synchronizedMethods(obj, transformOrFirstMethodName, ...methodNames) {
    let transformCb;
    if (isString(transformOrFirstMethodName)) {
      // just one of the methods
      methodNames.push(transformOrFirstMethodName);
    }
    else {
      transformCb = transformOrFirstMethodName;
    }

    for (const methodName of methodNames) {
      let method = obj[methodName];
      if (!isFunction(method)) {
        throw new Error(`invalid methodName ${methodName} in obj ${obj} is not a function`);
      }

      const { name } = method;

      // bind
      method = method.bind(obj);

      // transform
      transformCb && (method = transformCb(method));

      // hackfix: name
      method.__name = name;

      // override method
      obj[methodName] = this.synchronizedFunction(method);

      // add new method that does not cause deadlocks when called from another synchronized method
      obj[`_${methodName}`] = method;
    }
  }

  /**
   * Takes given function and returns a new function that is wrapped s.t.
   * when called, it adds itself as task and executes synchronously with this queue.
   * Returns a promise that is resolved once it has finished execution with it's original return value.
   */
  synchronizedFunction(cb) {
    return async function synchronized(...args) {
      const bound = cb.bind(null, ...args);
      bound.__name = cb.name;
      return this.enqueue(bound);
    }.bind(this);
  }
}