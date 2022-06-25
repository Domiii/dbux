import fs from 'fs';

// eslint-disable-next-line import/no-extraneous-dependencies
import { transformFileAsync } from '@babel/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import varDestructingPlugin from '@babel/plugin-transform-destructuring';
// eslint-disable-next-line import/no-extraneous-dependencies
import paramsDestructingPlugin from '@babel/plugin-transform-parameters';
// eslint-disable-next-line import/no-extraneous-dependencies
import prettier from 'prettier';
import NestedError from '@dbux/common/src/NestedError';

const transformOptions = {
  // presets: [
  //   'env'
  // ],
  retainLines: true,
  babelrc: false,
  configFile: false,
  include: (...args) => {
    // console.log('babel include', args);
    return true;
  },
  plugins: [
    /**
     * @see https://babeljs.io/docs/en/babel-plugin-transform-destructuring
     */
    varDestructingPlugin,
    paramsDestructingPlugin,
  ]
};


async function transformFile(fpath) {
  try {
    /**
     * Babel the file.
     * @see https://babeljs.io/docs/en/babel-core
     */
    const { code } = await transformFileAsync(fpath, transformOptions);
    const finalCode = prettier.format(code,
      { parser: "babel" }
    ) + '\n';

    // write back
    fs.writeFileSync(fpath, finalCode);

    console.log(`Transformed file: ${fpath}`);
  }
  catch (err) {
    throw new NestedError(`Could not transform file ${fpath}.`, err);
  }
}

export async function transformFiles(fpaths) {
  for (const fpath of fpaths) {
    await transformFile(fpath);
  }

  // await transformFile(fpaths[0]);
  // TODO: (maybe just manually) produce one patch here
  //    → then add it to assets → then add it to `extraPatches` array
}