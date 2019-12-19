import pluginTester from 'babel-plugin-tester/dist/plugin-tester';
import dbuxBabelPlugin from '..';
import defaultsDeep from 'lodash/defaultsDeep';
import mergeWith from 'lodash/mergeWith';
import { babelConfigNext, babelConfigEs5 } from './babelConfigs';
import path from 'path';
import fs from 'fs';
import { transformSync } from '@babel/core';

const { parse } = path;

const configs = {
  es5: babelConfigEs5,
  esNext: babelConfigNext
};

function fixTitle(title, version) {
  const { name, ext } = parse(title);
  return `${name}.${version}${ext}`;
}

export function writeResultCodeToFile(inputCode, title, babelOptions, plugin) {
  // see: https://github.com/babel-utils/babel-plugin-tester/blob/master/src/plugin-tester.js#L314
  babelOptions = mergeWith(
    {},
    babelOptions,
    {
      babelrc: false,
      configFile: false,
      plugins: [plugin]
    },
    function customizer(dst, src) {
      if (Array.isArray(dst)) {
        return dst.concat(src);
      }
    }
  );
  // console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
  const outputCode = transformSync(inputCode, babelOptions).code;

  const srcPath = __dirname + '/..';
  const samplesOutputPath = srcPath + '/__tests__/__samplesOutput__';
  const filename = title;
  fs.mkdirSync(samplesOutputPath, { recursive: true });
  fs.writeFileSync(samplesOutputPath + '/' + filename, outputCode);
}

export function runAllSnapshotTests(codes, filename, plugin, shouldWriteResultToFile) {
  codes.forEach((code, i) => {
    const title = `[${i}]${filename}`;
    runSnapshotTests(code, filename, title, {
      plugin
    }, shouldWriteResultToFile);
  });
}

/**
 * Snapshot-tests the given code (in given filename and w/ given title and optional config) using
 * es-next and es5.
 */
export function runSnapshotTests(code, filename, codeTitle, customTestConfig, shouldWriteResultToFile) {
  code = '/* #################################################################################### */\n' + code;

  for (const version in configs) {
    const babelConfig = configs[version];
    const babelOptions = Object.assign({
      filename
    }, babelConfig);
    const title = fixTitle(codeTitle, version);
    const defaultConfig = {
      plugin: customTestConfig.plugin || dbuxBabelPlugin,
      pluginName: customTestConfig.plugin?.name || 'dbux-babel-plugin',
      babelOptions,
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

    if (shouldWriteResultToFile) {
      writeResultCodeToFile(code, title, babelOptions, testConfig.plugin);
    }
  }
}