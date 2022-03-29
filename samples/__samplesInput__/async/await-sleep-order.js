const { P, v } = require('../../util/asyncUtil');

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

var p = P().then(() => {});
p
  .then(() => sleep(300))
  .then(() => { v('B3'); });

p
  .then(() => sleep(200))
  .then(() => { v('B2'); });
p
  .then(() => sleep(100))
  .then(() => { v('B1'); });