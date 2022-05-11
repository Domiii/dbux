import * as jsPlumbBrowserUI from '@jsplumb/browser-ui';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGTimelineView extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`<div class="timeline-view"></div>`);
  }

  setupEl() {
    this.nodes = [];
    this.jsPlumb = jsPlumbBrowserUI.newInstance({
      container: this.el
    });
  }

  update() {
    // rebuild graph
    this.jsPlumb.batch(() => {
      this.clearNodes();
      this.addNodes();
    });
  }

  buildGraph() {
    const { dataNodes } = this.states;

    // build nodes
    for (let i = 0; i < 10; i++) {
      const el = compileHtmlElement(/*html*/`<div class="timeline-node">Node#${i}</div>`);
      this.nodes[i] = el;
      this.el.appendChild(el);
      // instance.addEndpoint(el, { endpoint: DotEndpoint.type });
    }

    // add edges
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        this.jsPlumb.connect({ source: this.nodes[i], target: this.nodes[j] });
      }
    }
  }

  clearGraph() {
    for (const node of this.nodes) {
      this.jsPlumb.remove(node);
    }
  }
}
