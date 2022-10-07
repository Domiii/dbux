import sh from 'shelljs';
import Project from '../../projectLib/Project';
import Exercise from '../../projectLib/Exercise';
import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

export default class HexoProject extends Project {
  gitRemote = 'BugsJS/hexo.git';

  packageManager = 'yarn';

  canRunExercise(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    Object.assign(config, {
      // name: `bug #${bug.id}`,
      // require: ['./test/support/env.js'],
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
      runArgs: ['-t', 200000],    // timeout = 200s
      // NOTE: timeout cannot be disabled (maybe because it's an old version) - https://mochajs.org/#timeouts
      // runArgs: ['-t', '0'],
      // dbuxArgs: '--pw=.*',
      dbuxArgs: '--pw=.* --pb=lodash,bluebird,graceful-fs',
    });
    return config;
  }

  /**
   * TODO: this is not getting called anymore
   */
  getExerciseGitTag(exerciseNumber, tagCategory) {
    return `Bug-${exerciseNumber}-${tagCategory}`;
  }


  async selectExercise(exercise) {
    const {
      number, name
    } = exercise;
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
    const { projectPath } = this;
    const testArgs = this.getMochaRunArgs(exercise);

    const mochaCfg = {
      cwd: projectPath,
      testArgs,
      require: exercise.require,
      ...cfg
    };

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