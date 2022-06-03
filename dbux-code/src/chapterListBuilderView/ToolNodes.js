import fs from 'fs';
import allApplications from '@dbux/data/src/applications/allApplications';
import { pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import Process from '@dbux/projects/src/util/Process';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';
import { showInformationMessage } from '../codeUtil/codeModals';
import { getCurrentResearch } from '../research/Research';

/** @typedef {import('@dbux/projects/src/projectLib/Project').ProjectsManager} ProjectsManager */

const ProjectName = 'javascript-algorithms';
const ExportExercises = 20;

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

  writeExerciseJs(fileName, exercises) {
    const content = `module.exports = ${JSON.stringify(exercises, null, 2)}`;
    fs.writeFileSync(pathResolve(this.manager.getAssetPath('exercises'), fileName), content);
  }

  writeChapterListJs(fileName, exerciseList) {
    const exercisesByChapterName = new Map();
    for (const exercise of exerciseList) {
      const { chapter } = exercise;
      if (!exercisesByChapterName.has(chapter)) {
        exercisesByChapterName.set(chapter, []);
      }
      exercisesByChapterName.get(chapter).push(exercise);
    }

    const chapters = Array.from(exercisesByChapterName.entries()).map(([chapterName, exercises], index) => {
      return {
        id: index + 1,
        name: chapterName,
        exercises: exercises.map(e => e.id),
      };
    });

    const content = `module.exports = ${JSON.stringify(chapters, null, 2)}`;
    fs.writeFileSync(pathResolve(this.manager.getAssetPath('chapterLists'), fileName), content);
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

      progress.report({ message: `Generating exercise file...` });
      this.writeExerciseJs('javascript-algorithms-all.js', exercises);

      progress.report({ message: `Loading exercises...` });
      const exerciseList = project.reloadExercises('javascript-algorithms-all');
      this.treeNodeProvider.controller.exerciseList = exerciseList;

      progress.report({ message: `Generating chapter list file...` });
      this.writeChapterListJs('javascript-algorithms-all.js', exerciseList);

      progress.report({ message: `Loading chapter list...` });
      this.treeNodeProvider.controller.chapters = this.manager.reloadChapterList('javascript-algorithms-all');

      this.treeNodeProvider.refresh();
    }, { title: 'Generating Chapter List' });
  }
}

class ExportApplicationsNode extends ToolNode {
  static makeLabel() {
    return `Export all exercise applications`;
  }

  async handleClick() {

  }
}

class ExportApplicationsForceNode extends ToolNode {
  static makeLabel() {
    return `Export all exercise applications`;
  }

  async handleClick() {
    const { exerciseList } = this.treeNodeProvider.controller;
    if (!exerciseList) {
      showInformationMessage(`Please generate chapter list before exports`);
      return;
    }

    allApplications.clear();

    await runTaskWithProgressBar(async (progress) => {
      progress.report({ message: `Start exporting exercises...` });
      for (let i = 1; i <= ExportExercises; i++) {
        const exercise = exerciseList.getAt(i);

        if (exercise) {
          await this.manager.switchAndTestBug(exercise);
          const app = allApplications.getById(1);
          exportApplicationToFile(app, getCurrentResearch().getAppZipFilePath(app));
          allApplications.clear();
        }

        progress.report({ message: `(${i}/${ExportExercises}) finished...`, increment: Math.floor(100 / ExportExercises) });
      }
    }, { title: `Export applications` });
  }
}

export const ToolNodeClasses = [
  GenerateListNode,
  ExportApplicationsForceNode
];
