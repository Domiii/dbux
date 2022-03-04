import {
  ViewColumn
} from 'vscode';
import GraphHost from '@dbux/graph-host/src/GraphHost';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import { emitCallGraphAction } from '../userEvents';
import searchController from '../search/searchController';
import { getGlobalAnalysisViewController } from '../globalAnalysisView/GlobalAnalysisViewController';
import RichWebView from './RichWebView';
import { get as getMemento, set as setMemento } from '../memento';

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

  setContextFilter = (value) => {
    return setMemento(ContextFilterMementoKey, value);
  };

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    emitCallGraphAction,
    searchController,
    globalAnalysisViewController: getGlobalAnalysisViewController(),

    getContextFilter: this.getContextFilter,
    setContextFilter: this.setContextFilter
  }
}

/**
 * @type {GraphWebView}
 */
let graphWebView;

export async function showGraphView() {
  await initGraphView();
  return graphWebView.show();
}

export function hideGraphView() {
  graphWebView?.hide();
}

export async function initGraphView() {
  if (!graphWebView) {
    graphWebView = new GraphWebView();
    await graphWebView.init();
  }
}