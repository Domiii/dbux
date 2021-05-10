// ###########################################################################
// write "file-registry files"
// ###########################################################################

// write parser registry
const parserDir = path.resolve(MonoRoot, 'dbux-babel-plugin/src/parse').replace(/\\/g, '/');
writeFileRegistryFile('index.js', parserDir, (name) => !!t['is' + name]);

console.log('Generated dbux-babel-plugin/src/parse/index.js.');