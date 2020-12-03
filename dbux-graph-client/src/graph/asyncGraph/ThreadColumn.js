import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column vertical-align-center">
        <div data-el="title"></div>
        <div data-el="children" class="node-children flex-row"></div>
      </div>
    `);

    return el;
  }

  update() {
    const { threadId, nodes, nodeCount } = this.state;
    this.els.title.innerHTML = threadId;
    this.el.style.order = threadId;
    this.els.children.innerHTML = nodeCount;
  }

  buildChildrenHTML(nodes, nodeCount) {
    let html = '';
    const allContextOrder = new Set(nodes.map(node => node.order));
    for (let i = 0; i < nodeCount; ++i) {
      if (allContextOrder.has(i)) {
        html += `<div class="asyncNode">async node #${i}</div>`;
      }
      else {
        html += `<div class="asyncNode"></div>`;
      }
    }

    return html;
  }
}

export default ThreadColumn;