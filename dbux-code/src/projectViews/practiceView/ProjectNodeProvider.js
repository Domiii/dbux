import BaseTreeViewNodeProvider from '../../codeUtil/treeView/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../../codeUtil/treeView/EmptyNode';
import ProjectNode from './ProjectNode';
import ChapterNode from './ChapterNode';

export default class ProjectNodeProvider extends BaseTreeViewNodeProvider {
  constructor(context, treeViewController) {
    super('dbuxProjectView');
    this.controller = treeViewController;

    this.byChapter = true; // default

    this.initDefaultClickCommand(context);
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = [];

    if (this.byChapter) {
      const { chapters } = this.controller.manager;
      for (let chapter of chapters) {
        const node = this.buildChapterNode(chapter);
        roots.push(node);
      }
    }
    else {
      const { projects } = this.controller.manager;
      for (let project of projects) {
        const node = this.buildProjectNode(project);
        roots.push(node);
      }
      roots.reverse();
    }

    if (!roots.length) {
      roots.push(EmptyTreeViewNode.get('(Empty Project List)'));
    }

    return roots;
  }

  toggleListMode() {
    this.byChapter = !this.byChapter;
    this.controller.manager.reloadExercises();
    this.refresh();
  }

  buildProjectNode(project) {
    return this.buildNode(ProjectNode, project);
  }

  buildChapterNode(chapter) {
    return this.buildNode(ChapterNode, chapter);
  }
}
