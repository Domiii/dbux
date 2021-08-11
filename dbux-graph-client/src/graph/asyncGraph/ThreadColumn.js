import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { compileHtmlElement, getMatchParent } from '../../util/domUtil';

class ThreadColumn extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="flex-column cross-axis-align-center">
        <div data-el="title" class="async-thread-title"></div>
        <div data-el="children" class="async-thread flex-column full-width main-axis-align-start"></div>
      </div>
    `);

    return el;
  }

  setupEl() {
    // delegate click events
    this.el.addEventListener('click', event => {
      const asyncNode = getMatchParent('div.async-node', event.target, this.el);
      if (asyncNode) {
        if (event.target.matches('div.async-node-button')) {
          // TODO: handle different buttons(blocked: thread selection)
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
    this.els.title.innerHTML = `${threadId}`;
    this.el.style.order = threadId * (this.parent.state.ascendingMode ? 1 : -1);
    this.els.children.innerHTML = this.buildChildrenHTML();
  }

  buildChildrenHTML() {
    const { nodes, parentRootContextId, parentAsyncNodeId, rootContextIds, applicationId } = this.state;
    const firstRootInThread = nodes[0]?.asyncNode.rootContextId;
    const lastRootInThread = nodes[nodes.length - 1]?.asyncNode.rootContextId;
    let html = '';
    const nodesById = new Map(nodes.map(node => [node.asyncNode.rootContextId, node]));
    for (let rootContextId of rootContextIds) {
      const node = nodesById.get(rootContextId);
      let dotLabel, displayName, locLabel = '', syncInCount, syncOutCount;
      if (node) {
        dotLabel = '⬤';
        ({ displayName, locLabel, syncInCount, syncOutCount } = node);
      }
      else if (parentRootContextId === rootContextId) {
        dotLabel = '&nbsp;';
        displayName = '⬤';
      }
      else {
        const shouldAddLine = (firstRootInThread < rootContextId) && (rootContextId < lastRootInThread);
        dotLabel = shouldAddLine ? '|' : '&nbsp;';
        displayName = shouldAddLine ? '|' : '&nbsp;';
      }

      const forkButton = (firstRootInThread === rootContextId && parentRootContextId) ? /*html*/`
        <button class="async-node-button">${parentRootContextId}</button>
      ` : '';
      const syncInButton = (syncInCount) ? /*html*/`
        <button class="async-node-button">🡅</button>
      ` : '';
      const syncOutButton = (syncOutCount) ? /*html*/`
        <button class="async-node-button">🡇</button>
      ` : '';
      const buttons = [forkButton, syncInButton, syncOutButton].join('');
      const data = {
        'async-node-id': node?.asyncNode.asyncNodeId,
        'parent-async-node-id': parentAsyncNodeId,
        'application-id': applicationId
      };
      const dataTag = Object.entries(data).map(([key, val]) => `data-${key}="${val || ''}"`).join(' ');

      html += /*html*/`
        <div class="async-node full-width flex-row align-center" ${dataTag}>
          <div class="async-brief flex-row main-axie-align-center">
            ${dotLabel}
          </div>
          <div class="async-detail flex-column cross-axis-align-center">
            <div class="flex-row">
              <div>${displayName}</div>
              ${buttons}
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
    const { asyncNodeId, applicationId } = asyncNode.dataset;
    if (asyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, asyncNodeId);
    }
  }

  handleClickForkButton(asyncNode) {
    const { parentAsyncNodeId, applicationId } = asyncNode.dataset;
    if (parentAsyncNodeId) {
      this.remote.gotoAsyncNode(applicationId, parentAsyncNodeId);
    }
  }
}

export default ThreadColumn;