const _ = require('lodash');

/* dbux disable */
const src = {
  b: {
    c: {
      d: {
        e: {
          omittedMsg: 'hello'
        }
      }
    }
  }
};

const a = src;

function main(obj) {
  obj = cloneDeep(obj);
}

main({ abcd: a.b.c.d });

function cloneDeep(obj, onlyPlain) {
  obj = obj || {};
  return _.cloneDeepWith(obj, elem => {
    // Do not try to customize cloning of arrays or POJOs
    if (Array.isArray(elem) || _.isPlainObject(elem)) {
      return undefined;
    }

    // If we specified to clone only plain objects & arrays, we ignore everyhing else
    // In any case, don't clone stuff that's an object, but not a plain one - fx example sequelize models and instances
    if (onlyPlain || typeof elem === 'object') {
      return elem;
    }

    // Preserve special data-types like `fn` across clones. _.get() is used for checking up the prototype chain
    if (elem && typeof elem.clone === 'function') {
      return elem.clone();
    }
  });
}