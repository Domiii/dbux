import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';
import { decorateClasses } from '@/util/domUtil';

export default class GraphNode extends ClientComponentEndpoint {
  init() {
    const {
      nodeToggleBtn,
      nodeChildren
    } = this.owner.els;

    this.owner.el.classList.add('graph-node');
    this.btnEl = nodeToggleBtn;
    this.listEl = nodeChildren;

    // hide button if owner has no children
    const observerOptions = {
      childList: true
    };
    const observer = this.observer = new MutationObserver(this.toggleButtonVisible);
    observer.observe(nodeChildren, observerOptions);
    this.toggleButtonVisible();   // call initially

    // on click -> nextMode
    this.owner.dom.addEventListeners(this);
  }

  /**
   * NOTE: state.isExpanded might not always be mirrored by DOM (but we are trying to achieve just that here).
   */
  isDOMExpanded() {
    return !this.listEl.classList.contains('hidden');
  }

  toggleButtonVisible = () => {
    const hidden = !this.listEl.children.length;

    // show/hide button
    decorateClasses(this.btnEl, {
      hidden
    });
  }

  update() {
    const { listEl, btnEl, state: { mode } } = this;

    switch (mode) {
      case GraphNodeMode.ExpandChildren:
        listEl.classList.remove('hidden');
        btnEl.innerHTML = '☰';
        break;
      case GraphNodeMode.ExpandSubgraph:
        listEl.classList.remove('hidden');
        btnEl.innerHTML = '🌿';
        break;
      case GraphNodeMode.Collapsed:
        listEl.classList.add('hidden');
        btnEl.innerHTML = '▷';
        break;
    }
  }

  on = {
    nodeToggleBtn: {
      click() {
        this.remote.nextMode();
      }
    }
  }
}