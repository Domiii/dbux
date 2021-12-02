/**
 * NOTE: Jest apparently does its own module resolution, making it impossible to use `babel-register`.
 * TODO: provide generalized utilities to bring in our existing config and setup.
 */


module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        // debug: true,
        // useBuiltIns: "usage",
        shippedProposals: true,
        // corejs: {
        //   version: "3.15",
        //   proposals: true
        // }
      }
    ]
  ],
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
