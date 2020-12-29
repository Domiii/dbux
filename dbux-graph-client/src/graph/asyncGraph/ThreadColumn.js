import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column cross-axis-align-center">
        <div data-el="title"></div>
        <div data-el="children" class="flex-column full-width main-axis-align-start ellipsis-20"></div>
      </div>
    `);

    return el;
  }

  setupEl() {
    // delegate click events
    this.el.addEventListener('click', event => {
      const asyncNode = getMatchParent('div.async-node', event.target, this.el);
      if (asyncNode) {
        if (event.target.matches('div.async-fork-button')) {
          this.handleClickForkButton(asyncNode);
        }
        else {
          this.handleClickAsyncNode(asyncNode);
        }
      }
    });
  }

  update() {
    const { threadId } = this.state;
    this.els.title.innerHTML = `t${threadId}`;
    this.el.style.order = threadId;
    this.els.children.innerHTML = this.buildChildrenHTML();
  }

  buildChildrenHTML() {
    const { nodes, lastRunId, applicationId, threadId } = this.state;
    const firstRunInThread = nodes[0]?.context.runId;
    const lastRunInThread = nodes[nodes.length - 1]?.context.runId;
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.context.runId, node]));
    for (let runId = 1; runId <= lastRunId; ++runId) {
      const node = nodesById.get(runId);
      let dotLabel, displayName, locLabel, parentThreadId, contextId, parentContextId;
      if (node) {
        dotLabel = '⬤';
        ({ displayName, locLabel, parentThreadId, context: { contextId, parentContextId } } = node);
      }
      else {
        const shouldAddLine = (firstRunInThread < runId) && (runId < lastRunInThread);
        dotLabel = shouldAddLine ? '|' : '&nbsp;';
        displayName = shouldAddLine ? '|' : '&nbsp;';
        locLabel = '';
      }

      const forkButton = (runId === firstRunInThread && parentContextId) ? /*html*/`
        <div style="width:0px"><div class="async-fork-button">${parentThreadId}</div></div>
      ` : '';
      const data = {
        'application-id': applicationId,
        'run-id': runId,
        'context-id': contextId,
        'thread-id': threadId,
        'parent-context-id': parentContextId
      };
      const dataTag = Object.entries(data).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');

      html += /*html*/`
        <div class="async-node full-width flex-row align-center" ${dataTag}>
          <div class="async-brief flex-row main-axie-align-center">
            ${dotLabel}
            ${forkButton}
          </div>
          <div class="async-detail flex-column cross-axis-align-center">
            <div class="flex-row">
              <div>${displayName}</div>
              ${forkButton}
            </div>
            <div class="async-loc-label gray">
              <span>${locLabel}</span>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  handleClickAsyncNode(asyncNode) {
    const { applicationId, contextId } = asyncNode.dataset;
    if (applicationId && contextId) {
      this.remote.gotoContext(applicationId, contextId);
    }
  }

  handleClickForkButton(asyncNode) {
    const { applicationId, parentContextId } = asyncNode.dataset;
    if (applicationId && parentContextId) {
      this.remote.gotoContext(applicationId, parentContextId);
    }
  }
}

export default ThreadColumn;