import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGTimelineView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div class="timeline-view"></div>`);
  }

  setupEl() {
    this.nodeElMap = new Map();
    this.jsPlumb = jsPlumbBrowserUI.newInstance({
      container: this.el
    });
  }

  update() {
    // rebuild graph
    this.jsPlumb.batch(() => {
      this.clearGraph();
      this.buildGraph();
    });
  }

  buildGraph() {
    const { nodes, edges } = this.state;

    // build nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = compileHtmlElement(/*html*/`<div class="timeline-node">Node#${node.nodeId}</div>`);
      el.style.left = '200px';
      el.style.top = `${30 * i}px`;
      this.nodeElMap.set(node.nodeId, el);
      this.el.appendChild(el);
      // instance.addEndpoint(el, { endpoint: DotEndpoint.type });
      this.jsPlumb.manage(el);
    }

    // add edges
    for (const edge of edges) {
      const source = this.nodeElMap.get(edge.from);
      const target = this.nodeElMap.get(edge.to);
      this.jsPlumb.connect({ source, target });
    }
  }

  clearGraph() {
    for (const node of this.nodeElMap.values()) {
      this.jsPlumb.remove(node);
    }
    this.nodeElMap = new Map();
  }
}
