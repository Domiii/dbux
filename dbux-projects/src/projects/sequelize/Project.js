import { readPackageJson, writeMergePackageJson, writePackageJson } from '@dbux/cli/lib/package-util';
import { buildNodeCommand } from '../../util/nodeUtil';
import Project from '../../projectLib/Project';


export default class SequelizeProject extends Project {
  gitRemote = 'sequelize/sequelize.git';
  /**
   * @see https://github.com/sequelize/sequelize/tree/v6.6.5
   * @see https://github.com/sequelize/sequelize/tags
   * @see https://github.com/sequelize/sequelize/releases/tag/v6.6.5
   */
  gitCommit = 'tags/v6.6.5';
  packageManager = 'yarn';

  _fixPackageJson() {
    /**
     * NOTE: `yarn add` won't work as expected here
     * @see https://github.com/yarnpkg/yarn/issues/3270
     */
    const pkg = readPackageJson(this.projectPath);

    /** ########################################
     * for old sequelize only
     * #######################################*/

    // remove `husky`
    delete pkg.husky;

    // remove unnecessary (and easily failing) database packages.
    const unwanted = [
      'sqlite3',
      'pg',
      'pg-hstore',
      'pg-native',
      'mysql',
      'mysql2',
      'mariadb',
      'tedious'   // used for mssql
    ];
    for (const dep of unwanted) {
      delete pkg.dependencies[dep];
      delete pkg.devDependencies[dep];
    }
    
    /** ########################################
     * all versions of sequelize
     * #######################################*/

    /**
     * Also: fix `sqlite3` version to `^5` to avoid node-pre-gyp build errors
     * @see https://stackoverflow.com/a/68526977/2228771
     */
    pkg.dependencies.sqlite3 = '^5';

    // write `package.json`
    writePackageJson(this.projectPath, pkg);
  }

  /**
   * 
   */
  async beforeInstall() {
    this._fixPackageJson();
  }

  loadBugs() {
    return [
      {
        label: 'sscce1-sqlite',
        testFilePaths: ['sscce1.js']
      },
      {
        label: 'error1-sqlite',
        testFilePaths: ['error1.js']
      },
      {
        label: 'findOrCreate-atomic-violation',
        tag: 'v3.5.1',
        patch: 'findOrCreate-av1',
        testFilePaths: ['findOrCreate-av1.js']
      },
      {
        label: 'findOrCreate-serial',
        testFilePaths: ['findOrCreate-serial.js']
      },
      {
        label: 'findOrCreate-parallel',
        testFilePaths: ['findOrCreate-parallel.js']
      },
    ];
  }

  decorateBugForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      // -> lodash - future-work: it has issues w/ `Object.defineProperties` being polyfilled or proxied or otherwise replaced and ending up being `undefined` (or somesuch)?
      // -> bluebird
      dbuxArgs: '--pw=.* --pb=lodash,bluebird'
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
    });
  }

  /**
   * NOTE: this runs before bug's {@link Project#npmInstall}
   */
  afterSelectBug(bug) {
    this._fixPackageJson();
  }

  async testBugCommand(bug, cfg) {
    // TODO: generalize

    const runCfg = {
      env: {
        DIALECT: 'sqlite'
      }
    };

    return [
      buildNodeCommand({
        ...cfg,
        program: bug.testFilePaths[0]
      }),
      runCfg
    ];

    // // const bugArgs = this.getMochaRunArgs(bug);
    // const bugConfig = this.getMochaCfg(bug, [
    //   '-t 10000' // timeout
    // ]);

    // const mochaCfg = {
    //   ...cfg,
    //   ...bugConfig
    // };

    // // Debug shortcut:
    // // DEBUG=http node --inspect-brk --stack-trace-limit=100    --require "./test/support/env.js" "C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\cli\\bin\\dbux.js" run  --verbose=1 --pw=superagent "c:\\Users\\domin\\code\\dbux\\dbux_projects\\express/node_modules/mocha/bin/_mocha" -- --no-exit -c -t 10000 --grep "OPTIONS should only include each method once" -- test/app.options.js

    // return buildMochaRunCommand(mochaCfg);

    // TODO: enable auto attach (run command? or remind user?)
    //      see: https://code.visualstudio.com/blogs/2018/07/12/introducing-logpoints-and-auto-attach
    /*
    "type": "node",
    "request": "launch",
    "program": "${workspaceFolder}/node_modules/.bin/_mocha",
    "runtimeArgs": [
      "--stack-trace-limit=1000",
      "--preserve-symlinks"
    ],
    "cwd": "${workspaceFolder}",
    "args": [
      // "--reporter=json",
    ],
    */
  }
}