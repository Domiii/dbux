import getGlobal from '@dbux/common/src/getGlobal';

// export default function _setImmediate(cb) {
//   const _global_ = getGlobal();
//   const f = _global_._setImmediate || setTimeout;
//   f(cb);
// }

/**
 * @see https://github.com/Domiii/dbux/issues/444
 */
export default function scheduleNextPossibleRun(cb) {
  return Promise.resolve().then(cb);
}