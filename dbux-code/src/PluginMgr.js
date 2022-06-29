import NestedError from '@dbux/common/src/NestedError';
import { newLogger } from '@dbux/common/src/log/logger';
import { pathJoin } from '@dbux/common-node/src/util/pathUtil';
import { getAllFilesInFolders } from '@dbux/common-node/src/util/fileUtil';
import requireDynamic from '@dbux/common/src/util/requireDynamic';
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
      const pluginInit = requireDynamic(fpath);

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