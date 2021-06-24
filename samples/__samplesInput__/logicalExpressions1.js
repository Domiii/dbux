const fs = require('fs');
const path = require('path');

var exists = fs.existsSync || path.existsSync;

exports.keys = Object.keys || function (obj) {
  var keys = []
    , has = Object.prototype.hasOwnProperty // for `window` on <=IE8
}