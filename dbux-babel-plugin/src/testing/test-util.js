import pluginTester from 'babel-plugin-tester/dist/plugin-tester';
import plugin from '..';
import defaultsDeep from 'lodash/defaultsDeep';
import { babelConfigNext, babelConfigEs5 } from './babelConfigs';
import path from 'path';

const { parse } = path;

const configs = {
  es5: babelConfigEs5,
  esNext: babelConfigNext
};

function fixTitle(title, version) {
  const { name, ext } = parse(title);
  return `${name}.${version}${ext}`;
}

/**
 * Snapshot-tests the given code (in given filename and w/ given title and optional config) using
 * es-next and es5.
 */
export function runSnapshotTests(code, filename, codeTitle, customTestConfig) {
  code = '/* #################################################################################### */\n' + code;

  for (const version in configs) {
    const babelConfig = configs[version];
    const title = fixTitle(codeTitle, version);
    const defaultConfig = {
      plugin,
      pluginName: 'dbux-babel-plugin',
      babelOptions: Object.assign({
        filename
      }, babelConfig),
      filename,
      tests: [
        {
          title,
          code,
          snapshot: true
        }
      ]
    };
    const testConfig = defaultsDeep({}, customTestConfig, defaultConfig);
    pluginTester(testConfig);
  }
}