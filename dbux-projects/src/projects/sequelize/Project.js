import { buildNodeCommand } from '../../util/nodeUtil';
import Project from '../../projectLib/Project';


export default class SequelizeProject extends Project {
  gitRemote = 'sequelize/sequelize.git';

  packageManager = 'yarn';

  async afterInstall() {
    /**
     * TODO: fix `sqlite3` version to `^5` to avoid node-pre-gyp build errors
     * @see https://stackoverflow.com/a/68526977/2228771
     */
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
        label: 'atomic-violation1',
        tag: '3.5.1',
        testFilePaths: ['findOrCreate-av1.js']
      },
    ];
  }

  decorateBugForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      // future-work: lodash introduced some weird issues with `Object.defineProperties` being polyfilled or proxied or otherwise replaced and ending up being `undefined` (or somesuch)?
      dbuxArgs: '--pw=.* --pb=lodash'
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
    });
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