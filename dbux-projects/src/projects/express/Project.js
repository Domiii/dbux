import sh from 'shelljs';
import isArray from 'lodash/isArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';
import exerciseConfigs from './exerciseConfig';

/** @typedef {import('../../projectLib/ExerciseConfig').default} ExerciseConfig */

export default class ExpressProject extends Project {
  gitRemote = 'BugsJS/express.git';

  packageManager = 'npm';

  get envName() {
    return 'test';
  }

  /**
   * @return {ExerciseConfig[]}
   */
  loadExerciseConfigs() {
    return exerciseConfigs;
  }

  getExerciseGitTag(exerciseNumber, tagCategory) {
    return `Bug-${exerciseNumber}-${tagCategory}`;
  }

  async selectExercise(bug) {
    const {
      number, name
    } = bug;
    const tagCategory = "test"; // "test", "fix" or "full"
    const tag = this.getExerciseGitTag(number, tagCategory);

    if ((await this.gitGetCurrentTagName()).startsWith(tag)) {
      // do not checkout bug, if we already on the right tag
      return;
    }

    // checkout the bug branch
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || number}...`);

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this.exec(`${this.gitCommand} checkout -B ${tag} tags/${tag}`);
  }

  async runCommand(exercise, cfg) {
    // const bugArgs = this.getMochaRunArgs(bug);
    const testCfg = this.getMochaCfg(exercise, [
      '-t 10000' // timeout
    ]);

    const mochaCfg = {
      ...cfg,
      ...testCfg
    };

    // Debug shortcut:
    // DEBUG=http node --inspect-brk --stack-trace-limit=100    --require "./test/support/env.js" "C:\\Users\\domin\\code\\dbux\\node_modules\\@dbux\\cli\\bin\\dbux.js" run  --verbose=1 --pw=superagent "c:\\Users\\domin\\code\\dbux\\dbux_projects\\express/node_modules/mocha/bin/_mocha" -- --no-exit -c -t 10000 --grep "OPTIONS should only include each method once" -- test/app.options.js

    return buildMochaRunCommand(mochaCfg);

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