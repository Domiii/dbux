import path from 'path';
import isFunction from 'lodash/isFunction';
import { serializeEnv, globPatternToEntry } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import portPid from '@dbux/common-node/src/util/portPid';
import terminate from '@dbux/common-node/src/util/terminate';

import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('WebpackBuilder');

/** @typedef { import("../projectLib/Project").default } Project */

const distFolderName = 'dist';

export class WebpackOptions {
  websitePort;

  /**
   * Used for context if {@link #context} is not given.
   */
  projectRoot;

  context;

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

  /**
   * Globs of files to be copied from `projectRoot` to `distFolder`.
   * Uses {@link globRelative}.
   * @type {string | Array.<string>}
   */
  copy;

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

  get needsHtmlPlugin() {
    return this.cfg.htmlPlugin;
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
      // eslint-disable-next-line quote-props
      'webpack': '^5',
      'webpack-cli': '^4',
      // 'webpack-config-utils': '???',
      'copy-webpack-plugin': '^8',
      'clean-webpack-plugin': '^4',
      'babel-loader': '^8'
    };
    if (this.needsDevServer) {
      deps['webpack-dev-server'] = '^4';
    }
    if (this.needsHtmlPlugin) {
      deps['html-webpack-plugin'] = '^5';
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
      bug.website = new URL(bug.websitePath || '/', `http://localhost:${websitePort}`).href;
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
    // return this.project.getSharedDependencyPath('webpack-cli/bin/cli.js');
    const { project } = this;
    return project.getNodeModulesFile('webpack-cli/bin/cli.js');
  }

  async checkPort(port, projectManager) {
    do {
      const pids = await portPid(port).tcp;
      if (!pids.length) {
        return;
      }

      // port is occupied
      if (projectManager.interactiveMode) {
        const userDecision = await projectManager.externals.confirm(
          `Port ${port} is occupied by process(es) with PID: ${pids.join(', ')}. Should Dbux attempt to kill these processes?`,
          { modal: true }
        );
        if (userDecision) {
          for (const pid of pids) {
            debug(`Terminating PID ${pid}...`);
            await terminate(pid);
          }
          continue;
        }
      }
      else {
        // TODO: use config, if not interactive
      }
      throw new Error(`Could not start webpack: PORT already in use by another process.`);

    // eslint-disable-next-line no-constant-condition
    } while (true);
  }

  async startWatchMode(exercise, projectManager) {
    const { project } = this;

    const port = exercise.websitePort || 0;

    await this.checkPort(port, projectManager);


    // prepare args (encode into `env`)
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
        port
      }
    };
    env = serializeEnv(env);

    // start webpack
    const cwd = project.packageJsonFolder;
    const webpackConfigPath = pathResolve(project.getAssetsTargetFolder(), 'dbux.webpack.config.js');

    const nodeArgs = ' --stack-trace-limit=100';
    const webpackCliBin = this.webpackCliBin();
    const webpackCliCommand = this.webpackCliCommand();
    const webpackArgs = `--config "${webpackConfigPath}" ${env}`;
    let cmd = `node${nodeArgs} "${webpackCliBin}" ${webpackCliCommand} ${webpackArgs}`;

    return project.execBackground(cmd, { cwd });
  }
}

export default WebpackBuilder;