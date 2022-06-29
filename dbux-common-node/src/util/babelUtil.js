/* eslint-disable no-console */
import fs from 'fs';
import NestedError from '@dbux/common/src/NestedError';
import requireDynamic from '@dbux/common/src/util/requireDynamic';


let options;

let transformFileAsync, varDestructingPlugin, paramsPlugin, prettier;

/**
 * This function requires everything.
 * NOTE: this is done so because this whole thing is required in contexts where Babel is not always available.
 *      E.g.: it is used by dbux-code in development mode only (not in non-dev mode).
 */
function init() {
  if (options) {
    // already initialized
    return;
  }

  ({ transformFileAsync } = requireDynamic('@babel/core'));
  varDestructingPlugin = requireDynamic('@babel/plugin-transform-destructuring');
  paramsPlugin = requireDynamic('@babel/plugin-transform-parameters');
  prettier = requireDynamic('prettier');
  
  // prepare options
  options = {
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
      paramsPlugin,
    ]
  };
}


async function transformFile(fpath) {
  init();

  try {
    /**
     * Babel the file.
     * @see https://babeljs.io/docs/en/babel-core
     */
    const { code } = await transformFileAsync(fpath, options);
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