import sleep from './sleep';

export default class SyncPromise {
  promise;

  _resolve;
  _reject;

  constructor(timeout) {
    this.timeout = timeout;
  }

  startIfNotStarted() {
    if (!this.promise) {
      this.start();
    }
    return this.promise;
  }

  start() {
    const promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    if (this.timeout) {
      this.promise = Promise.race([promise, sleep(this.timeout).then(() => this.resolve())]);
    }
    else {
      this.promise = promise;
    }
  }

  resolve(arg) {
    if (this.promise) {
      this._handleFinish();
      this._resolve(arg);
    }
  }

  reject(arg) {
    if (this.promise) {
      this._handleFinish();
      this._reject(arg);
    }
  }

  wait() {
    return this.promise;
  }

  _handleFinish() {
    this.promise = null;
  }
}