import pluginTester from 'babel-plugin-tester/dist/plugin-tester';
import plugin from '..';
import path from 'path';
import defaultsDeep from 'lodash/defaultsDeep';

export function runSnapshotTest(code, filename, title, config) {
  const defaultConfig = {
    plugin,
    pluginName: 'dbux-babel-plugin',
    babelOptions: {
      filename,
      configFile: path.join(__dirname, '../../babel.config.js'),
    },
    filename,
    tests: [
      {
        title,
        code,
        snapshot: true
      }
    ]
  };
  config = defaultsDeep(config, defaultConfig);

  pluginTester(config);
}