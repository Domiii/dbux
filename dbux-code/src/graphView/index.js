import GraphWebView from './GraphWebView';

let graphHost;

/**
 * 
 */

function initGraphWebView(context) {
  if (!graphHost) {
    graphHost = new GraphWebView(context);
  }
}

export async function showGraphView(context) {
  initGraphWebView(context);
  return graphHost.show();
}

export async function restoreGraphView(context) {
  initGraphWebView(context);
  return graphHost.restorePreviousState();
}