import fs from 'fs';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import Process from '@dbux/projects/src/util/Process';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/projects/src/projectLib/Project').ProjectsManager} ProjectsManager */

const ProjectName = 'javascript-algorithms';

class ToolNode extends BaseTreeViewNode {
  /**
   * @type {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }
}

class GenerateListNode extends ToolNode {
  static makeLabel() {
    return 'Generate List';
  }

  get projectPath() {
    return pathResolve(this.manager.config.projectsRoot, ProjectName);
  }

  getExerciseFilePath(project) {
    return project.getAss;
  }

  writeExerciseJs(path, exercises) {
    const content = `module.exports = ${JSON.stringify(exercises, null, 2)}`;
    fs.writeFileSync(path, content);
  }

  async handleClick() {
    const project = this.manager.projects.getByName(ProjectName);

    await runTaskWithProgressBar(async (progress) => {
      if (!project.doesProjectFolderExist()) {
        progress.report({ message: `Installing project "${project.name}"...` });
        await this.manager.runner.installProject(project);
      }

      await this.manager.externals.initRuntimeServer();

      progress.report({ message: 'Parsing tests...' });
      const processOptions = {
        cwd: this.projectPath,
      };
      // const testFiles = await Process.execCaptureOut('npx jest --listTest', { processOptions }).split('\n');
      const testDirectory = 'src/algorithms';
      const testData = JSON.parse(await Process.execCaptureOut(`npx jest --json --verbose ${testDirectory}`, { processOptions }));

      const exercises = [];
      const addedPattern = new Set();

      for (const testResult of testData.testResults) {
        for (const assertionResult of testResult.assertionResults) {
          const { fullName } = assertionResult;
          if (!addedPattern.has(fullName)) {
            addedPattern.add(fullName);
          }
          else {
            continue;
          }
          const chapter = fullName.substring(0, fullName.indexOf(' '));
          const exerciseConfig = {
            name: fullName,
            label: fullName,
            testNamePattern: fullName,
            chapter,
            testFilePaths: [pathRelative(this.projectPath, testResult.name)],
          };
          exercises.push(exerciseConfig);
        }
      }

      progress.report({ message: `Writing "javascript-algorithms-all.js"...` });
      this.writeExerciseJs(pathResolve(project.getAssetPath('exercises'), 'javascript-algorithms-all.js'), exercises);
    }, { title: 'Generating Chapter List' });
  }
}

export const ToolNodeClasses = [
  GenerateListNode,
];
