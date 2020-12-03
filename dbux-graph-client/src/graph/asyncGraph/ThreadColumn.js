import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column">
        <div data-el="title"></div>
        <div data-el="children" class="node-children flex-column"></div>
      </div>
    `);

    return el;
  }

  update() {
    const { threadId, nodeIds, nodeCount } = this.state;
    this.els.title.innerHTML = `thread#${threadId}`;
    this.el.style.order = threadId;
    this.els.children.innerHTML = this.buildChildrenHTML(nodeIds, nodeCount);
  }

  buildChildrenHTML(nodeIds, nodeCount) {
    let html = '';
    const nodeIdSet = new Set(nodeIds);
    for (let i = 0; i < nodeCount; ++i) {
      if (nodeIdSet.has(i)) {
        html += `<div class="asyncNode">#${i}</div>`;
      }
      else {
        html += `<div class="asyncNode"></div>`;
      }
    }

    return html;
  }
}

export default ThreadColumn;