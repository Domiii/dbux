import { newLogger } from '@dbux/common/src/log/logger';
import { getProjectManager } from '../projectViews/projectControl';
import ChapterListBuilderNodeProvider from './ChapterListBuilderNodeProvider';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ChapterListBuilderViewController');

let controller;

export default class ChapterListBuilderViewController {
  constructor() {
    this.treeNodeProvider = new ChapterListBuilderNodeProvider(this);
  }

  get treeView() {
    return this.treeNodeProvider.treeView;
  }

  get manager() {
    return getProjectManager();
  }

  initOnActivate(context) {
    // click event listener
    this.treeNodeProvider.initDefaultClickCommand(context);
  }
}

// ###########################################################################
// init
// ###########################################################################

export function initChapterListBuilderView(context) {
  controller = new ChapterListBuilderViewController();
  controller.initOnActivate(context);

  // refresh right away
  controller.treeNodeProvider.refresh();
}
