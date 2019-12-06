/**
 * Result:
    [PLUGIN] pre plugin1
    [PLUGIN] pre plugin2
    [PLUGIN] pre pres2
    [PLUGIN] pre pres1
    [PLUGIN] Program plugin1
    [PLUGIN] Program plugin2
    [PLUGIN] Program pres2
    [PLUGIN] Program pres1
    [PLUGIN] post plugin1
    [PLUGIN] post plugin2
    [PLUGIN] post pres2
    [PLUGIN] post pres1
 */

function makeReporterPlugin(msg) {
  return () => {
    return {
      pre() {
        console.log('[PLUGIN] pre', msg);
      },
      visitor: {
        Program() {
          console.log('[PLUGIN] Program', msg);
        }
      },
      post() {
        console.log('[PLUGIN] post', msg);
      },
    };
  };
}

const pres1 = {
  plugins: [
    makeReporterPlugin('pres1')
  ]
};
const pres2 = {
  plugins: [
    makeReporterPlugin('pres2')
  ]
};

const plugin1 = makeReporterPlugin('plugin1');
const plugin2 = makeReporterPlugin('plugin2');

module.exports = {
  "presets": [
    pres1,
    pres2
  ],
  "plugins": [
    plugin1,
    plugin2
  ]
};