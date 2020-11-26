
/**
 * @see https://github.com/caolan/async/blob/master/lib/forever.js#L37
 */
export function foreverCb(task, done) {
  function next(err) {
    if (err) return done(err);
    if (err === false) return;
    task(next);
  }
  return next();
}


// TODO: https://github.com/yortus/asyncawait/blob/master/src/async/asyncIterator.js