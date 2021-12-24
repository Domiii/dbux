
module.exports = function plugin(
  context,
  { overrides }
) {
  return {
    name: 'docusaurus-plugin-local-resolve',
    /**
     * @see https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis
     * @see https://github.com/atomicpages/docusaurus-plugin-module-alias/blob/master/src/index.ts
     */
    configureWebpack() {
      return {
        ...overrides
      };
    },
  };
};