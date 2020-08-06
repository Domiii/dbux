import GraphWebView from './GraphWebView';

let graphWebView;

/**
 * 
 */

function initGraphWebView(context) {
  if (!graphWebView) {
    graphWebView = new GraphWebView(context);
  }
}

export async function showGraphView(context) {
  initGraphWebView(context);
  return graphWebView.show();
}

export async function restoreGraphView(context) {
  initGraphWebView(context);
  return graphWebView.init();
}