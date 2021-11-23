import NestedError from '@dbux/common/src/NestedError';
import { getAllFilesInFolders } from '@dbux/common-node/src/util/fileUtil';
import { pathJoin } from '@dbux/common-node/src/util/pathUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import { getExtensionPath } from './codeUtil/codePath';

const { log, debug, warn, error: logError } = newLogger('dbux-code');

export default class PluginMgr {
  _pluginFolderName = 'plugins';
  plugins = [];

  get pluginFolder() {
    return pathJoin(getExtensionPath(), this._pluginFolderName);
  }

  loadPlugin = async (f) => {
    const { pluginFolder } = this;
    const fpath = pathJoin(pluginFolder, f);
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require,camelcase
      const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
      const pluginInit = requireFunc(fpath);

      if (!pluginInit) {
        throw new Error(`Plugin did not export anything. Make sure to export an init function (e.g. \`exports.init = async function init(dbuxCode) { dosomething })\`.`);
      }

      // future-work: expose dbux-code systems to plugin
      return await pluginInit();
    }
    catch (err) {
      throw new NestedError(`plugin initialization failed for "${fpath}"`, err);
    }
  }

  async init() {
    const { pluginFolder } = this;
    const pluginFiles = getAllFilesInFolders(pluginFolder);

    this.plugins = await Promise.all(
      pluginFiles.map(this.loadPlugin)
    );
  }
}

export async function initPlugins() {
  
}