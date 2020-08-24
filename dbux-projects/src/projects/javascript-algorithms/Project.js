import path from 'path';
import Project from '@dbux/projects/src/projectLib/Project';
import { buildJestRunBugCommand } from '@dbux/projects/src/util/jestUtil';

export default class JavascriptAlgorithmProject extends Project {
  gitRemote = 'trekhleb/javascript-algorithms.git';

  loadBugs() {
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

  async selectBug(bug) {
    // nothing to do here
  }

  async testBugCommand(/* bug, cfg */) {
    // TODO: copy correct version from express/Project.js

    // const { projectPath } = this;
    // const bugArgs = this.getBugArgs(bug);

    // const jestArgs = `${bugArgs}`;
    // return buildJestRunBugCommand(projectPath, jestArgs, bug.require, debugPort);
  }
}