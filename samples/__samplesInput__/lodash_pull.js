const pull = require('lodash/pull');
console.debug(`require(${require.resolve('lodash/isFunction')})`);

const a = [1,2,3,4];
const r = pull(a, 3);
console.log(r, a);

