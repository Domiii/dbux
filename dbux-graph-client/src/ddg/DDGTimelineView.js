import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGTimelineView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div>
      <div data-el="status"></div>
      <div class="timeline-view"></div>
    </div>`);
  }

  setupEl() {
    this.nodeElMap = new Map();
    this.jsPlumb = jsPlumbBrowserUI.newInstance({
      container: this.el
    });
  }

  update() {
    // update status message
    if (this.state.failureReason) {
      this.els.status.className = 'alert alert-danger';
      this.els.status.textContent = 'Cannot build DataDependencyGraph: ' + this.state.failureReason;
    }
    else {
      this.els.status.textContent = '';
    }

    // rebuild graph
    this.jsPlumb.batch(() => {
      this.clearGraph();
      this.buildGraph();
    });
  }

  buildGraph() {
    const { nodes, edges } = this.state;

    if (!nodes) {
      return;
    }

    // build nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = compileHtmlElement(/*html*/`<div class="timeline-node">Node#${node.entityId}</div>`);
      el.style.left = '200px';
      el.style.top = `${30 * i}px`;
      this.nodeElMap.set(node.entityId, el);
      this.el.appendChild(el);
      // instance.addEndpoint(el, { endpoint: DotEndpoint.type });
      this.jsPlumb.manage(el);
    }

    if (edges) {
      // add edges
      for (const edge of edges) {
        const source = this.nodeElMap.get(edge.from);
        const target = this.nodeElMap.get(edge.to);
        this.jsPlumb.connect({ source, target });
      }
    }
  }

  clearGraph() {
    for (const node of this.nodeElMap.values()) {
      this.jsPlumb.remove(node);
    }
    this.nodeElMap = new Map();
  }
}
