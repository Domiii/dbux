/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-console */

let promiseId = 0;
const promiseSet = new Set();

const originalPromise = globalThis.Promise;
globalThis.Promise = class Promise extends originalPromise {
  constructor(executor) {
    let thisPromiseId = promiseId++;

    const wrapExecutor = (resolve, reject) => {
      const wrapResolve = (result) => {
        resolve(result);
      };
      const wrapReject = (err) => {
        reject(err);
      };

      if (typeof executor === 'function') {
        executor?.(wrapResolve, wrapReject);
      }
    };

    super(wrapExecutor);
    this.promiseId = thisPromiseId;
    promiseSet.add(this);
  }

  then(successCb, failCb) {
    let childPromise = super.then((result) => {
      if (typeof successCb === 'function') {
        return successCb(result);
      }
    }, (err) => {
      if (typeof failCb === 'function') {
        return failCb(err);
      }
    });
    console.log(`Promise ${this.promiseId} has child promise ${childPromise.promiseId}`);
    return childPromise;
  }

  catch(failCb) {
    return this.then(null, failCb);
  }

  finally(cb) {
    let childPromise = super.finally();
    console.log(`Promise ${this.promiseId} has child promise ${childPromise.promiseId}`);
    return childPromise;
  }
};

const originalPromiseThen = originalPromise.prototype.then;
originalPromise.prototype.then = function (successCb, failCb) {
  if (!promiseSet.has(this)) {
    promiseSet.add(this);
    this.promiseId = promiseId++;
  }

  let childPromise = originalPromiseThen.call(this, successCb, failCb);
  promiseSet.add(childPromise);
  if (childPromise.promiseId === undefined) {
    childPromise.promiseId = promiseId++;
  }

  console.log(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (then)`);
  return childPromise;
};

const originalPromiseCatch = originalPromise.prototype.catch;
originalPromise.prototype.catch = function (failCb) {
  return this.then(null, failCb);
};

const originalPromiseFinally = originalPromise.prototype.finally;
originalPromise.prototype.finally = function (cb) {
  if (!promiseSet.has(this)) {
    promiseSet.add(this);
    this.promiseId = promiseId++;
  }

  let childPromise = originalPromiseFinally.call(this, cb);
  promiseSet.add(childPromise);
  if (childPromise.promiseId === undefined) {
    childPromise.promiseId = promiseId++;
  }

  console.log(`Original promise ${this.promiseId} has child ${childPromise.promiseId} (finally)`);
  return childPromise;
};


// Test 1
// async function f() { return 87; }

// let op = f();
// let op2 = op.then(console.log);
// let op3 = op.catch(console.error);
// let op4 = op.finally(() => console.log('fff'));

// console.log('should be false: ', isPromise(op));
// console.log('should be 0 1 2 3: ', op.promiseId, op2.promiseId, op3.promiseId, op4.promiseId);

// let op5 = Promise.all([op, op2, op3, op4]);
// console.log('op5: ', op5.promiseId);

// // Test 2
// let p1 = new Promise((r) => r(432))
//   .then(x => x + 4)
//   .then(x => x * 2)
//   .then(console.log)
//   .catch(e => 'error')
//   .finally(() => console.log('meow'));
// console.log('should be 9: ', p1.promiseId);

// let p2 = new Promise(123);
// let p3 = new Promise(324);
// let p4 = Promise.race([p1, p2, p3]);
// p4.then(console.log);
// console.log(`p2 = ${p2.promiseId}`);
// console.log(`p3 = ${p3.promiseId}`);
// console.log(`p4 = ${p4.promiseId}`);

// let p5 = Promise.resolve(p3);
// p5.then(console.log);
// console.log(`p5 = ${p5.promiseId}`);

// let p6 = Promise.reject("QAQ");
// p6.catch(console.error);
// console.log(`p6 = ${p6.promiseId}`);