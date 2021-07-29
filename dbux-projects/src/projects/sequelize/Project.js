import { buildNodeCommand } from '../../util/nodeUtil';
import Project from '../../projectLib/Project';


export default class ExpressProject extends Project {
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
        // cd dbux_projects/sequelize
        // --inspect-brk --expose-gc
        // DIALECT=sqlite; node --stack-trace-limit=100  "../../node_modules/@dbux/cli/bin/dbux.js" run --runtime="{\"valuesDisabled\":1}" --verbose=1 --pw=.* "sscce.js" --
        
        label: 'sscce1-sqlite',
        // testRe: 'OPTIONS should only include each method once',
        testFilePaths: ['sscce.js'],
        bugLocations: [
          // {
          //   fileName: 'lib/router/index.js',
          //   line: 156
          // }
        ]
      }
    ];
  }

  decorateBug(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      dbuxArgs: '--pw=.*'
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
        program: `sscce.js`
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