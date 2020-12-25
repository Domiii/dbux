import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column cross-axis-align-center">
        <div data-el="title"></div>
        <div data-el="children" class="node-children flex-column cross-axis-align-center ellipsis-20"></div>
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
  }

  buildChildrenHTML() {
    const { nodes, lastRunId, applicationId } = this.state;
    const firstRunId = nodes[0]?.context.runId;
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.context.runId, node]));
    for (let i = 1; i <= lastRunId; ++i) {
      const node = nodesById.get(i);
      let nodeLabel, displayName, locLabel, contextId;
      if (node) {
        nodeLabel = '⬤';
        ({ displayName, locLabel, context: { contextId } } = node);
      }
      else {
        nodeLabel = firstRunId < i ? '|' : '&nbsp;';
        displayName = firstRunId < i ? '|' : '&nbsp;';
        locLabel = firstRunId < i ? '|' : '&nbsp;';
      }
      
      html += `<div class="async-node-detail cross-axis-align-center main-axis-align-center" data-application-id="${applicationId || ''}" data-context-id="${contextId || ''}">
          <div class="async-dot-label">${nodeLabel}</div>
          <div class="flex-column cross-axis-align-center">
            <div class="async-detail-label">${displayName}</div>
            <div class="async-detail-label loc-label gray">
              <span>${locLabel}</span>
            </div>
          </div>
        </div>`;
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