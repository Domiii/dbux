import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';

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
      const asyncNode = getMatchParent('div.async-node, div.async-node-detail', event.target, this.el);
      if (asyncNode) {
        this.handleClickAsyncNode(asyncNode, event);
      }
    });
  }

  update() {
    const { threadId } = this.state;
    this.els.title.innerHTML = `thread#${threadId}`;
    this.el.style.order = threadId;
    this.els.children.innerHTML = this.buildChildrenHTML();
    // this.els.children.innerHTML = this.buildDetailChildrenHTML(nodes, nodeCount, applicationId);
  }

  buildChildrenHTML() {
    const { nodes, lastRunId, applicationId } = this.state;
    const firstRunId = nodes[0]?.context.runId;
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.context.runId, node]));
    for (let i = 1; i <= lastRunId; ++i) {
      if (nodesById.has(i)) {
        const { displayName, context: { contextId } } = nodesById.get(i);
        const detailLabel = `<div class="async-dot-label">⬤</div><div class="async-detail-label">${displayName}</div>`;
        html += `<div class="async-node-detail vertical-align-center horizontal-align-center" data-application-id="${applicationId}" data-context-id="${contextId}">
            ${detailLabel}
          </div>`;
      }
      else {
        html += `<div class="async-node-detail vertical-align-center horizontal-align-center" data-application-id="" data-context-id="">${firstRunId < i ? '|' : ''}</div>`;
      }
    }

    return html;
  }

  buildDetailChildrenHTML() {
    const { nodes, nodeCount, applicationId } = this.state;
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.context.contextId, node]));
    for (let i = 1; i < nodeCount; ++i) {
      if (nodesById.has(i)) {
        const { displayName } = nodesById.get(i);
        html += `<div class="async-node-detail vertical-align-center" data-application-id="${applicationId}" data-context-id="${i}">${displayName}</div>`;
      }
      else {
        html += `<div class="async-node-detail vertical-align-center" data-application-id="" data-context-id=""></div>`;
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