import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column">
        <div data-el="title"></div>
        <div data-el="children" class="node-children flex-column vertical-align-center"></div>
      </div>
    `);

    return el;
  }

  setupEl() {
    this.el.addEventListener('click', event => {
      if (event.target.matches('div.async-node')) {
        this.handleClickAsyncNode(event.target, event);
      }
    });
  }

  update() {
    const { applicationId, threadId, nodeIds, nodeCount } = this.state;
    this.els.title.innerHTML = `thread#${threadId}`;
    this.el.style.order = threadId;
    this.els.children.innerHTML = this.buildChildrenHTML(nodeIds, nodeCount, applicationId);
  }

  buildChildrenHTML(nodeIds, nodeCount, applicationId) {
    let html = '';
    const nodeIdSet = new Set(nodeIds);
    for (let i = 1; i < nodeCount; ++i) {
      if (nodeIdSet.has(i)) {
        html += `<div class="async-node vertical-align-center horizontal-align-center" data-application-id="${applicationId}" data-context-id="${i}">#${i}</div>`;
      }
      else {
        html += `<div class="async-node vertical-align-center horizontal-align-center" data-application-id="" data-context-id=""></div>`;
      }
    }

    return html;
  }

  handleClickAsyncNode(node) {
    const { applicationId, contextId } = node.dataset;
    if (applicationId && contextId) {
      this.remote.gotoContext(applicationId, contextId);
    }
  }
}

export default ThreadColumn;