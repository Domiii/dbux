import path from 'path';
import fs from 'fs';
import pluginTester from 'babel-plugin-tester/dist/plugin-tester';
import defaultsDeep from 'lodash/defaultsDeep';
import mergeWith from 'lodash/mergeWith';
import { transformSync } from '@babel/core';
import { babelConfigNext, babelConfigEs5 } from './babelConfigs';
import dbuxBabelPlugin from '..';

const { parse } = path;

const AllConfigs = {
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
    {
      plugins: [plugin]
    },
    babelOptions,
    {
      babelrc: false,
      configFile: false
    },
    function customizer(dst, src) {
      if (Array.isArray(dst)) {
        return dst.concat(src);
      }
    }
  );
  // console.warn(babelOptions.plugins.map(p => (typeof p === 'function' ? p.toString() : JSON.stringify(p)).split('\n')[0]).join(','));
  const outputCode = transformSync(inputCode, babelOptions).code;

  // const srcPath = __dirname + '/..';
  // const rootPath = srcPath + '/..';
  const rootPath = __dirname + '/../../..';
  const samplesOutputPath = rootPath + '/samples/__samplesOutput__';
  const filename = title;
  fs.mkdirSync(samplesOutputPath, { recursive: true });
  const fpath = path.resolve(samplesOutputPath + '/' + filename);
  console.debug('Writing file', fpath);
  fs.writeFileSync(fpath, outputCode);
}

export function runAllSnapshotTests(codes, filename, plugin, shouldWriteResultToFile = false, customTestConfig = null) {
  codes.forEach((code, i) => {
    const title = `[${i}]${filename}`;
    runSnapshotTests(code, filename, title, shouldWriteResultToFile, {
      plugin,
      ...customTestConfig
    });
  });
}

function formatNoWhitespace(code) {
  return code.replace(/\s+/g, ' ');
}

/**
 * Snapshot-tests the given code (in given filename and w/ given title and optional config) using
 * es-next and es5.
 */
export function runSnapshotTests(code, filename, codeTitle, shouldWriteResultToFile, customTestConfig, versions = null) {
  // code = '/* #################################################################################### */\n' + code;

  let configs = versions ?
    Object.fromEntries(versions.map(v => [v, AllConfigs[v]])) :
    AllConfigs;

  const configArr = configs && Object.values(configs);
  if (!configArr?.length || configArr.some(cfg => !cfg)) {
    configs = { default: {} };  // no configuration
    // throw new Error('invalid `versions` parameter (empty or invalid versions provided - see `AllConfigs` for valid set) - ' + versions);
  }

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

    for (const test of testConfig.tests) {
      if (!test.snapshot) {
        console.warn(`'babel-plugin-tester' is not good in dealing with plugins that are not supposed to change their output.\
        Consider using 'justRunMyPlugin' instead.`);
        test.formatResult = test.formatResult || formatNoWhitespace;
      }
      // expect(test.output || test.snapshot,
      //   'In `babel-plugin-tester`\'s each `tests` config needs either `output` or `snapshot` to be set; ' +
      //   'else it will assume that the plugin does not modify the code. If your code does not modify the code, set `tests: [{ output: code, snapshot: false}]` explicitely. ' +
      //   '(NOTE: The problem with plugin-tester\'s default assumption is that babel might still modify the code even if the plugin does not - ' +
      //   'e.g. when targeting `es5`, babel will prefix the code with a `"use strict";` causing the test to fail.)'
      // ).toBeTruthy();
    }

    if (shouldWriteResultToFile) {
      writeResultCodeToFile(code, title, babelOptions, testConfig.plugin);
    }
  }
}