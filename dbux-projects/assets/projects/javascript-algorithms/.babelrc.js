// NOTE: Jest apparently does its own module resolution, making it impossible to use `babel-register`

module.exports = {
  "presets": ["@babel/preset-env"],
  "plugins": [
    ["@dbux/babel-plugin", {
      verbose: 1
    }]],

  ignore: [
    // '**/node_modules/**',
    function shouldIgnore(modulePath, ...otherArgs) {
      const allow = true;
      console.debug(`[Dbux] BABEL`, modulePath, allow);
      return !allow;
    }
  ]
};
