import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import ExerciseNode from './ExerciseNode';

/** @typedef {import('@dbux/projects/src/projectLib/Chapter').default} Chapter */

/** @typedef {import('@dbux/projects/src/ProjectsManager').default} ProjectsManager */

export default class ChapterNode extends BaseTreeViewNode {
  static makeLabel({ id, name }) {
    return `Chapter ${id}: ${name}`;
  }

  /**
   * @type {Chapter}
   */
  get chapter() {
    return this.entry;
  }

  /**
   * @type {ProjectsManager}
   */
  get manager() {
    return this.treeNodeProvider.controller.manager;
  }

  get contextValue() {
    return `dbuxProjectView.chapterNode`;
  }

  makeIconPath() {
    return '';
  }

  buildChildren() {
    const exercises = Array.from(this.chapter.exercises);
    return exercises.map(this.buildExerciseNode.bind(this));
  }

  buildExerciseNode(exercise) {
    return this.treeNodeProvider.buildNode(ExerciseNode, exercise, this);
  }
}