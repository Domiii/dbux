import Project from '../../projectLib/Project';
import { buildJestRunBugCommand } from '../../util/jestUtil';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

export default class JavascriptAlgorithmProject extends Project {
  gitRemote = 'trekhleb/javascript-algorithms.git';

  rmFiles = [
    '.babelrc',       // we need .babelrc.js instead
    '.huskyrc.json'   // unwanted commit hooks
  ];

  /**
   * @return {ExerciseConfig[]}
   */
  loadExercises() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        // https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js
        id: 1,
        testName: 'BubbleSort should sort array',
        testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js'],
      }
    ];

    return bugs.
      map((bug) => {
        if (!bug.testFilePaths) {
          // bug not fully configured yet
          return null;
        }

        return {
          // id: i + 1,
          name: bug.testName,
          // description: bug.testName,
          runArgs: [
            '--runInBand', // -i
            '-t',
            `"${bug.testName}"`,
            '--runTestsByPath',
            bug.testFilePaths.join(' ')
          ],
          ...bug,
          // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
        };
      }).
      filter(bug => !!bug);
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