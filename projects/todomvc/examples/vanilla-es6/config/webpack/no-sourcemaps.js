
/**
 * @see https://webpack.js.org/contribute/writing-a-loader/
 */
module.exports = function noSourcemaps(source, map) {
  this.callback(null, source)
};