import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';
import { decorateClasses } from '@/util/domUtil';

export default class Highlighter extends ClientComponentEndpoint {
  init() {
    const {
      
    } = this.owner.els;

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
    nodeToggleBtn.addEventListener('click', () => this.remote.nextMode());
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
}