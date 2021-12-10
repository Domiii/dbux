import path from 'path';
import isFunction from 'lodash/isFunction';
import { serializeEnv, globPatternToEntry } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';

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

  sharedAssetFolder = 'webpack';

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
   * `runCommand` should not use @dbux/cli.
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
      deps['webpack-dev-server'] = '^4';
    }
    await this.project.installPackages(deps, shared);
  }

  initProject(project) {
    this.project = project;
  }

  getProjectRoot(bug) {
    const { project } = this;
    const { projectPath } = project;
    return this.getCfgValue(bug, 'projectRoot') || projectPath;
  }

  getOutputPath(bug) {
    return pathResolve(this.getProjectRoot(bug), distFolderName);
  }

  getContext(bug) {
    return this.getCfgValue(bug, 'context') || this.getProjectRoot(bug);
  }

  getEntry(exercise, force = false) {
    if (!force && this._entry) {
      return this._entry;
    }
    let entry = this.getCfgValue(exercise, 'entry');
    if (!entry) {
      // return getAllFilesInFolders(path.join(this.projectPath, folder));
      // return globToEntry(this.projectPath, 'js/*');
      let entryPatterns = this.getCfgValue(exercise, 'entryPattern');
      if (!entryPatterns) {
        throw new Error(`"${exercise.id}" - WebpackBuilder not configured correctly - must provide entry or entryPattern.`);
      }

      const contextRoot = this.getContext(exercise);
      entry = globPatternToEntry(contextRoot, entryPatterns);
    }
    return this._entry = entry;
  }

  getEntryInputPath(key, bug) {
    const contextRoot = this.getContext(bug);
    const entry = this.getEntry(bug);
    const value = entry?.[key];
    return value && pathResolve(contextRoot, value);
  }

  getEntryOutputPath(key, bug) {
    const outputPath = this.getOutputPath(bug);
    return pathResolve(outputPath, key + '.js');
  }

  getWatchPaths(bug) {
    const paths = this.getCfgValue(bug, 'watchFilePaths');
    if (paths) {
      return paths;
    }

    // no explicit watch files -> select all entry keys by default
    const entry = this.getEntry(bug);
    return Object.keys(entry)
      .map(entryKey => this.getEntryOutputPath(entryKey, bug));
  }

  getCopyPlugin(bug) {
    const copyPatterns = this.getCfgValue(bug, 'copy');
    const projectRoot = this.getProjectRoot(bug);
    if (copyPatterns) {
      return globRelative(projectRoot, copyPatterns);
    }
    return null;
  }

  getCfgValue(exercise, name) {
    const { project, cfg } = this;

    let value = exercise[name] || cfg[name];
    if (isFunction(value)) {
      // this === project, first arg = bug
      value = value.call(project, exercise);
    }
    return value;
  }

  /**
   * NOTE: this is separate from `loadBugs` because `loadBugs` might be called before the project has been downloaded.
   * This function however is called after download, so that all files are ready and accessible.
   */
  decorateExerciseForRun(bug) {
    const {
      cfg: { websitePort }
    } = this;

    // prepare entry
    this.getEntry(bug, true);

    bug.watchFilePaths = this.getWatchPaths(bug);

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

  async startWatchMode(exercise) {
    const { project, cfg } = this;
    const { projectPath } = project;

    const {
      nodeArgs = '',
      processOptions
    } = cfg;

    // prepare args

    const target = this.getCfgValue(exercise, 'target') || 'web';
    const webpackConfig = this.getCfgValue(exercise, 'webpackConfig');
    const projectRoot = this.getProjectRoot(exercise);
    const outputPath = this.getOutputPath(exercise);
    const context = this.getContext(exercise);
    const entry = this.getEntry();
    const moreEnv = this.getCfgValue(exercise, 'env');
    const copyPlugin = this.getCopyPlugin(exercise);

    let env = {
      ...moreEnv,
      /**
       * NOTE: `cfg` is interpreted by dbux.webpack.config.base.js.
       */
      cfg: {
        // TODO: add dbuxArgs
        ...webpackConfig,
        projectRoot,
        outputPath,
        context,
        entry,
        target,
        copyPlugin,
        port: exercise.websitePort || 0
      }
    };
    env = serializeEnv(env);

    // start webpack
    const webpackConfigPath = path.join(projectPath, 'dbux.webpack.config.js');
    const webpackArgs = `--config ${webpackConfigPath} ${env}`;

    const webpackCliBin = this.webpackCliBin();
    const webpackCliCommand = this.webpackCliCommand();
    let cmd = `node ${nodeArgs} --stack-trace-limit=100 ${webpackCliBin} ${webpackCliCommand} ${webpackArgs}`;

    // TODO: find better solution for this
    cmd = cmd.replace(/\\/g, '/');

    return project.execBackground(cmd, processOptions);
  }
}

export default WebpackBuilder;