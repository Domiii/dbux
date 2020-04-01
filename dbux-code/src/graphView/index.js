import GraphHost from './GraphHost';

let graphHost;

/**
 * 
 */
export async function showGraphView(context, application) {
  if (!graphHost) {
    graphHost = new GraphHost(context, application);
  }
  graphHost.show();
}
