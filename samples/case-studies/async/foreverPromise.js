/**
 * @file
 * This will cause an infinite loop, and we cannot observe it either because socket.io won't send out the data.
 * 
 * @see https://github.com/caolan/async/blob/master/lib/forever.js#L37
 */

// import { sleep } from './asyncUtil';


// function print(...args) {
//   console.log(...args);
// }

export default function foreverPromise(task) {
  function next() {
    return Promise.resolve(task()).
      then(next);
  }
  return next();
}


// function run(start) {
//   let x = start;
//   foreverPromise(
//     () => Promise.resolve(print(++x))
//       .then(() => sleep(400))
//   );
// }

// run(100);
// run(500);