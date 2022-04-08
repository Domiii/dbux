exports.x = 1;
exports.f = function() {
  return 2;
};
module.exports.y = 3;

console.log(exports.x, exports.f(), exports.y);