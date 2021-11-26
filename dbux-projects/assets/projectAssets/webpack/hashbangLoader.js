
module.exports = function hashbangLoader(source) {
  this.cacheable && this.cacheable();
  if ((typeof source === "string") && (/^#!/.test(source))) {
    // don't remove the first line, or else all source mapping is screwed.
    source = source.replace(/^#![^\n\r]*/, '');
    // console.log('FIRST LINEs:', source.split('\n').slice(0, 5).join('\n'));
  }
  return source;
  // this.value = [value];
  // return "module.exports = " + JSON.stringify(value, undefined, "\t") + ";";
};