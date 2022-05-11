import {
  ViewColumn
} from 'vscode';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import DDGHost from '@dbux/graph-host/src/DDGHost';
import { getThemeResourcePathUri } from '../codeUtil/codePath';
import { emitCallGraphAction } from '../userEvents';
import RichWebView from './RichWebView';

const defaultColumn = ViewColumn.Two;

export default class DataDependencyGraphWebView extends RichWebView {
  constructor() {
    super(DDGHost, 'dbux-data-graph', defaultColumn);
  }

  getIcon() {
    return getThemeResourcePathUri('dependency.svg');
  }

  getMainScriptPath() {
    return 'dist/web/ddg.client.js';
  }

  // ###########################################################################
  // provide externals to HostComponentManager
  // ###########################################################################

  externals = {
    
  }
}

/**
 * @type {DataDependencyGraphWebView}
 */
let dDGWebView;

export async function showDDGView() {
  await initDDGView();
  await dDGWebView.show();
  // TODO: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: true });
}

export function hideDDGView() {
  dDGWebView?.hide();
  // TODO: add new action type
  // emitCallGraphAction(UserActionType.CallGraphVisibilityChanged, { isShowing: false });
}

export async function initDDGView() {
  if (!dDGWebView) {
    dDGWebView = new DataDependencyGraphWebView();
    await dDGWebView.init();
  }
}