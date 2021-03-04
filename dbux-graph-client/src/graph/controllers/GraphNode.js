import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { decorateClasses } from '../../util/domUtil';

export default class GraphNode extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   *  children `nodeToggleBtn`
   *  children `NodeChildren`
   */
  init() {
    const {
      nodeToggleBtn,
      // nodeChildren
    } = this.owner.els;

    this.owner.el.classList.add('graph-node');

    // // hide button if owner has no children
    // const observerOptions = {
    //   childList: true
    // };

    // const observer = this.observer = new MutationObserver(this.renderListEmptyState);
    // observer.observe(nodeChildren, observerOptions);
    this.renderListEmptyState();   // call initially

    // on click -> nextMode
    this.owner.dom.addEventListeners(this, true);

    nodeToggleBtn?.addEventListener('click', (/* evt */) => {
      this.remote.nextMode();
    });
  }

  get btnEl() {
    return this.owner.els.nodeToggleBtn;
  }

  get listEl() {
    return this.owner.els.nodeChildren;
  }
  
  // /**
  //  * NOTE: state.isExpanded might not always be mirrored by DOM (but we are trying to achieve just that here).
  //  */
  // isDOMExpanded() {
  //   return !this.listEl.classList.contains('hidden');
  // }

  // isListEmpty() {
  //   const { listEl } = this;
  //   return !listEl.children.length;
  // }

  /**
   * Hide button if list is empty
   */
  renderListEmptyState = () => {
    // const { btnEl, listEl } = this;

    // // show/hide button
    // // btnEl && decorateClasses(btnEl, {
    // //   hidden: this.isListEmpty()
    // // });

    // decorateClasses(listEl, {
    //   hidden: this.isListEmpty()
    // });

    this.render();
  }

  update() {
    this.render();
  }

  render() {
    const { listEl, btnEl, state: { mode, hasChildren } } = this;

    // if (this.isListEmpty()) {
    //   // button should already be hidden -> now also hide list
    //   listEl.classList.add('hidden');
    // }
    // if (!this.isListEmpty()) {
    if (hasChildren) {
      switch (mode) {
        case GraphNodeMode.ExpandChildren:
          listEl.classList.remove('hidden');
          btnEl && (btnEl.innerHTML = '-');
          break;
        case GraphNodeMode.ExpandSubgraph:
          listEl.classList.remove('hidden');
          btnEl && (btnEl.innerHTML = '☰');
          break;
        case GraphNodeMode.Collapsed:
          // NOTE: cannot hide children if it has no button (for now)
          btnEl && listEl.classList.add('hidden');
          btnEl && (btnEl.innerHTML = '▷');
          break;
      }
    }
    else {
      listEl.classList.add('hidden');
    }
  }

  on = {
    nodeToggleBtn: {
      focus(evt) { evt.target.blur(); }
    }
  }
}