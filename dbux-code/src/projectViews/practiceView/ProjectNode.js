import Project from '@dbux/projects/src/projectLib/Project';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import ExerciseNode from './ExerciseNode';
import { runTaskWithProgressBar } from '../../codeUtil/runTaskWithProgressBar';
import { showInformationMessage } from '../../codeUtil/codeModals';

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project.name;
  }

  /**
   * @type {Project}
   */
  get project() {
    return this.entry;
  }

  /**
   * @type {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get description() {
    return this.project._installed ? 'installed' : '';
  }

  get contextValue() {
    return `dbuxProjectView.projectNode.${RunStatus.getName(this.project.runStatus)}`;
  }

  makeIconPath() {
    switch (this.project.runStatus) {
      case RunStatus.None:
        return '';
      case RunStatus.Busy:
        return 'hourglass.svg';
      case RunStatus.RunningInBackground:
        return 'play.svg';
      case RunStatus.Done:
        return 'dependency.svg';
      default:
        return '';
    }
  }

  buildChildren() {
    // getOrLoadBugs returns a `BugList`, use Array.from to convert to array
    const bugs = Array.from(this.project.getOrLoadExercises());
    return bugs.map(this.buildExerciseNode.bind(this));
  }

  buildExerciseNode(bug) {
    return this.treeNodeProvider.buildNode(ExerciseNode, bug, this);
  }

  async cleanUp() {
    const confirmMessage = `How do you want to clean up the project: ${this.project.name}?`;
    const btnConfig = {
      "Flush Cache Only": async () => {
        await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
          progress.report({ message: 'deleting project folder...' });
          this.project.deleteCacheFolder();
        }, {
          cancellable: false,
          title: this.project.name,
        });

        this.treeNodeProvider.refresh();
        showInformationMessage('Cache flushed successfully.');
      },
      "Clear Log Files": async () => {
        // TODO: better explain this
        await this.project.clearLog();
        showInformationMessage('Log files removed successfully.');
      },
      "Delete Project (+ Cache)": async () => {
        const success = await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
          progress.report({ message: 'deleting project folder...' });

          return await this.project.deleteProjectFolder();
        }, {
          cancellable: false,
          title: this.project.name,
        });

        if (success) {
          this.treeNodeProvider.refresh();
          await showInformationMessage('Project has been deleted successfully.');
        }
      }
    };
    await showInformationMessage(confirmMessage, btnConfig, { modal: true });
  }
}