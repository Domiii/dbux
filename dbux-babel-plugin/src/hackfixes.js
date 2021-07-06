// NOTE: 'crypto' will be shimmed by webpack (since we currently build babel-plugin as `umd`, not as node module)
// import nodeCrypto from 'crypto';
const nodeCrypto = __non_webpack_require__('crypto');

/**
 * @see https://github.com/yahoo/serialize-javascript/issues/87
 */
(function hackfixes() {
  // eslint-disable-next-line global-require
  if (!globalThis.crypto) {
    globalThis.crypto = {};
  }
  if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = (buf) => {
      const bytes = nodeCrypto.randomBytes(buf.length);
      buf.set(bytes);
      return buf;
    };
  }
})();