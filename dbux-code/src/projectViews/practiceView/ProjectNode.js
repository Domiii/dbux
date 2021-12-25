import Project from '@dbux/projects/src/projectLib/Project';
import RunStatus from '@dbux/projects/src/projectLib/RunStatus';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import cleanUp from './cleanUp';
import ExerciseNode from './ExerciseNode';

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
    const bugs = Array.from(this.project.exercises);
    return bugs.map(this.buildExerciseNode.bind(this));
  }

  buildExerciseNode(bug) {
    return this.treeNodeProvider.buildNode(ExerciseNode, bug, this);
  }

  async cleanUp() {
    await cleanUp(this.treeNodeProvider, this.project);
  }
}