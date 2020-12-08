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
    // delegate click event on async nodes
    this.el.addEventListener('click', event => {
      if (event.target.matches('div.async-node')) {
        this.handleClickAsyncNode(event.target, event);
      }
    });
  }

  update() {
    const { applicationId, threadId, nodes, nodeCount } = this.state;
    this.els.title.innerHTML = `thread#${threadId}`;
    this.el.style.order = threadId;
    this.els.children.innerHTML = this.buildChildrenHTML(nodes, nodeCount, applicationId);
  }

  buildChildrenHTML(nodes, nodeCount, applicationId) {
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.context.contextId, node]));
    for (let i = 1; i < nodeCount; ++i) {
      if (nodesById.has(i)) {
        const { displayName } = nodesById.get(i);
        html += `<div class="async-node vertical-align-center" data-application-id="${applicationId}" data-context-id="${i}">${displayName}</div>`;
      }
      else {
        html += `<div class="async-node vertical-align-center" data-application-id="" data-context-id=""></div>`;
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