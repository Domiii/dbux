import {
  ViewColumn
} from 'vscode';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import GraphHost from '@dbux/graph-host/src/GraphHost';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import { showQuickPick } from '../codeUtil/codeModals';
import { emitCallGraphAction, emitCallGraphTraceAction } from '../userEvents';
import searchController from '../search/searchController';
import { getGlobalAnalysisViewController } from '../globalAnalysisView/GlobalAnalysisViewController';
import { get as getMemento, set as setMemento } from '../memento';
import RichWebView from './RichWebView';

const defaultColumn = ViewColumn.Two;

const ContextFilterMementoKey = 'graph-context-filter';

export default class GraphWebView extends RichWebView {
  constructor() {
    super(GraphHost, 'dbux-graph', defaultColumn);
  }

  getIcon() {
    return getThemeResourcePathUri('tree.svg');
  }

  getMainScriptPath() {
    return 'dist/web/graph.client.js';
  }

  getContextFilter = () => {
    return getMemento(ContextFilterMementoKey);
  };

  setContextFilter = async (value) => {
    return await setMemento(ContextFilterMementoKey, value);
  };

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    emitCallGraphAction,
    emitCallGraphTraceAction,
    searchController,
    globalAnalysisViewController: getGlobalAnalysisViewController(),
    showQuickPick,

    getContextFilter: this.getContextFilter,
    setContextFilter: this.setContextFilter,
  }
}

/**
 * @type {GraphWebView}
 */
let graphWebView;

export async function showGraphView() {
  await initGraphView();
  await graphWebView.show();
  emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
}

export function hideGraphView() {
  graphWebView?.dispose();
  emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: false });
}

export async function initGraphView() {
  if (!graphWebView) {
    graphWebView = new GraphWebView();
    await graphWebView.init();
  }
}