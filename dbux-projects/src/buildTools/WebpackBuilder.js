import path from 'path';
import glob from 'glob';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import { filesToEntry, getWebpackJs, getWebpackDevServerJs, serializeEnv, fileWithoutExt } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';

/** @typedef { import("../projectLib/Project").default } Project */

const distFolderName = 'dist';

export class WebpackOptions {
  websitePort;

  /**
   * NOTE: this can be many things.
   * 1. a single pattern string, where all matching files will be added to `entry` individually,
   * 2. an array of pattern strings,
   * 3. that array can also include [parent, pattern] arrays, where the file is in the `parent` folder,
   *    but `parent` is excluded from its entry key (which is the output file path).
   *
   * Is used by {@link WebpackBuilder#getEntry}.
   * 
   * @type {Array.<Array.<string> | string> | string}
   */
  entryPattern;
  
  entry;

  watchFilePaths;
}

class WebpackBuilder {
  /**
   * @type {Project}
   */
  project;

  /**
   * @type {WebpackOptions}
   */
  cfg;

  /**
   * Depends on {@link WebpackOptions#entryPattern}.
   * If given, this is used to populate: (i) env.entry and (ii) `bug.watchFilePaths` (if not otherwise overwritten).
   */
  _entry;

  /**
   * @param {WebpackOptions} cfg 
   */
  constructor(cfg) {
    this.cfg = cfg;
  }

  get needsDevServer() {
    const {
      cfg: { websitePort },
    } = this;
    return !!websitePort;
  }

  /**
   * WebpackBuilder already instruments and injects dbux.
   * `testBugCommand` should not use @dbux/cli.
   */
  get needsDbuxCli() {
    return false;
  }

  get mainEntryPoint() {
    return this.cfg.mainEntryPoint;
  }

  async afterInstall() {
    const shared = false; // <- don't share for now (since it messes with Dbux's own dependencies)
    const deps = {
      // future-work: yarn IGNORES carret versioning. Does not add carret to `package.json`
      // eslint-disable-next-line quote-props
      'webpack': '^5',
      'webpack-cli': '^4',
      // 'webpack-config-utils': '???',
      'copy-webpack-plugin': '^8',
      'clean-webpack-plugin': '^4'
    };
    if (this.needsDevServer) {
      deps['webpack-dev-server'] = '^3';
    }
    await this.project.installPackages(deps, shared);
  }

  initProject(project) {
    this.project = project;
  }

  async getContext(bug) {
    const { project } = this;
    const { projectPath } = project;

    return await this.getCfgValue(bug, 'context') || projectPath;
  }

  async getEntry(bug, force = false) {
    if (!force && this._entry) {
      return this._entry;
    }
    let entry = await this.getCfgValue(bug, 'entry');
    if (!entry) {
      // return getAllFilesInFolders(path.join(this.projectPath, folder));
      // return globToEntry(this.projectPath, 'js/*');
      let entryPatterns = await this.getCfgValue(bug, 'entryPattern');
      if (!entryPatterns) {
        throw new Error(`"${bug.id}" - WebpackBuilder not configured correctly - must provide entry or entryPattern.`);
      }

      entryPatterns = Array.isArray(entryPatterns) ? entryPatterns : [entryPatterns];
      const contextRoot = await this.getContext(bug);
      entry = Object.fromEntries(
        entryPatterns.flatMap(pattern => {
          let parent;
          if (Array.isArray(pattern)) {
            [parent, pattern] = pattern;
          }
          else {
            parent = '';
            // const startIdx = pattern.indexOf('*');
            // if (startIdx < 0) {
            //   throw new Error(`"${bug.id}" - invalid entryPattern is missing wildcard (*)`);
            // }
            // const parentIdx = pattern.lastIndexOf('/', startIdx);
            // if (parentIdx < 0) {
            //   pattern = ['', pattern];
            // }
            // else {
            //   // split by the last path-separator before the first wildcard
            //   pattern = [pattern.substring(0, parentIdx), pattern.substring(parentIdx + 1)];
            // }
          }
          const entryRoot = pathResolve(contextRoot, parent);
          return glob
            .sync(pathResolve(entryRoot, pattern))
            .map(fpath => [
              fileWithoutExt(pathRelative(entryRoot, fpath)),
              fpath
            ]);
        })
      );
      if (isEmpty(entry)) {
        throw new Error(`"${bug.id}" - entryPattern did not match any files: ${entryPatterns}`);
      }
    }
    return this._entry = entry;
  }

  async getEntryInputPath(key) {
    const entry = await this.getEntry();
    return this.entry?.[key];
  }

  async getEntryOutputPath(key) {
    const entry = await this.getEntry();
    return this.entry?.[key];
  }

  async convertEntryPathToAbsolute(entryValue) {
    TODO;
    // TODO: fix getWatchPaths, getEntryInputPath, getEntryOutputPath
    // TODO: fix ProjectRoot in webpack.config.base
    // TODO: fix ProjectRoot in webpack.config.base
  }

  async getWatchPaths(bug) {
    const paths = await this.getCfgValue(bug, 'watchFilePaths');
    if (paths) {
      return paths;
    }
    const {
      project: { projectPath }
    } = this;

    // no explicit watch files -> select all entry keys by default
    const entry = await this.getEntry(bug);
    return Object.keys(entry)
      .map(file => path.resolve(projectPath, distFolderName, file + '.js'));
  }

  async getCopyPlugin(bug) {
    const copyPatterns = await this.getCfgValue(bug, 'copy');
    if (copyPatterns) {
      return globRelative(this.project.projectPath, copyPatterns);
    }
    return null;
  }

  async getCfgValue(bug, name) {
    const { project, cfg } = this;

    let value = bug[name] || cfg[name];
    if (isFunction(value)) {
      // this === project, first arg = bug
      value = await value.call(project, bug);
    }
    return value;
  }

  /**
   * NOTE: this is separate from `loadBugs` because `loadBugs` might be called before the project has been downloaded.
   * This function however is called after download, so that all files are ready and accessible.
   */
  async decorateBugForRun(bug) {
    const {
      cfg: { websitePort }
    } = this;

    // prepare entry
    await this.getEntry(bug, true);

    bug.watchFilePaths = await this.getWatchPaths(bug);

    if (websitePort) {
      // website settings
      bug.websitePort = websitePort;
      bug.website = `http://localhost:${websitePort}${bug.websitePath || '/'}`;
    }
  }

  // getWebpackDevServerJs() {
  //   // return this.project.getSharedDependencyPath(getWebpackDevServerJs());
  //   return path.join('node_modules', getWebpackDevServerJs());
  // }

  // getWebpackJs() {
  //   // return this.project.getSharedDependencyPath(getWebpackJs());
  //   return path.join('node_modules', getWebpackJs());
  // }

  webpackCliCommand() {
    return this.needsDevServer ? 'serve' : 'watch';
  }

  webpackCliBin() {
    // return this.cfg.webpackCliBin || (this.needsDevServer ? this.getWebpackDevServerJs() : this.getWebpackJs());
    return this.project.getSharedDependencyPath('webpack-cli/bin/cli.js');
  }

  async startWatchMode(bug) {
    const { project, cfg } = this;
    const { projectPath } = project;

    const {
      nodeArgs = '',
      processOptions
    } = cfg;

    // prepare args

    const moreEnv = await this.getCfgValue(bug, 'env');
    const context = await this.getContext(bug);
    const entry = await this.getEntry();
    const copyPlugin = await this.getCopyPlugin(bug);

    const env = serializeEnv({
      // TODO: add dbuxArgs
      ...moreEnv,
      context,
      entry,
      copyPlugin,
      port: bug.websitePort || 0
    });

    // start webpack
    const webpackConfig = path.join(projectPath, 'dbux.webpack.config.js');
    const webpackArgs = `--config ${webpackConfig} ${env}`;

    const webpackCliBin = this.webpackCliBin();
    const webpackCliCommand = this.webpackCliCommand();
    let cmd = `node ${nodeArgs} --stack-trace-limit=100 ${webpackCliBin} ${webpackCliCommand} ${webpackArgs}`;

    // TODO: find better solution for this
    cmd = cmd.replace(/\\/g, '/');

    return project.execBackground(cmd, processOptions);
  }
}

export default WebpackBuilder;