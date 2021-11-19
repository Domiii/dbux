import Project from '../../projectLib/Project';
import { buildJestRunBugCommand } from '../../util/jestUtil';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

export default class JavascriptAlgorithmProject extends Project {
  gitRemote = 'trekhleb/javascript-algorithms.git';

  rmFiles = [
    '.babelrc',       // we need .babelrc.js instead
    '.huskyrc.json'   // unwanted commit hooks
  ];

  canRun(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    return {
      // id: i + 1,
      name: config.testName,
      // description: bug.testName,
      runArgs: [
        '--runInBand', // -i
        '-t',
        `"${config.testName}"`,
        '--runTestsByPath',
        config.testFilePaths.join(' ')
      ],
      ...config,
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
    };
  }

  async selectExercise(bug) {
    // nothing to do here
  }

  async runCommand(bug, cfg) {
    const { projectPath } = this;
    // const bugArgs = this.getMochaRunArgs(bug);
    const testCfg = this.getJestCfg(bug, [
      '--setupFilesAfterEnv ./dbuxJestSetup.js',
      '--testTimeout 30000' // timeout
    ]);

    const mochaCfg = {
      ...cfg,
      ...testCfg,
      dbuxJs: null,
      cwd: projectPath,
    };

    // node --stack-trace-limit=100 "./node_modules/jest/bin/jest.js" --runInBand -t "BubbleSort should sort array" --runTestsByPath src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js --cache=false
    return buildJestRunBugCommand(mochaCfg);
  }
}