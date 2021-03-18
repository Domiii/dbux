import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { decorateClasses } from '../../util/domUtil';

export default class GraphNode extends ClientComponentEndpoint {
  init() {
    const {
      previousModeButton,
      nextModeButton,
      nodeChildren
    } = this.owner.els;

    this.owner.el.classList.add('graph-node');

    // hide button if owner has no children
    const observerOptions = {
      childList: true
    };
    const observer = this.observer = new MutationObserver(this.renderListEmptyState);
    observer.observe(nodeChildren, observerOptions);
    this.renderListEmptyState();   // call initially

    // on click -> nextMode
    this.owner.dom.addEventListeners(this, true);

    previousModeButton?.addEventListener('click', (/* evt */) => {
      this.remote.previousMode();
    });

    nextModeButton?.addEventListener('click', (/* evt */) => {
      this.remote.nextMode();
    });
  }

  get btnEl() {
    return this.owner.els.nodeToggleBtn;
  }

  get childrenEl() {
    return this.owner.els.nodeChildren;
  }

  /**
   * NOTE: state.isExpanded might not always be mirrored by DOM (but we are trying to achieve just that here).
   */
  isDOMExpanded() {
    return !this.childrenEl.classList.contains('hidden');
  }

  isListEmpty() {
    const { childrenEl: listEl } = this;
    return !listEl.children.length;
  }

  /**
   * Hide button if list is empty
   */
  renderListEmptyState = () => {
    const { childrenEl } = this;

    // show/hide button
    // btnEl && decorateClasses(btnEl, {
    //   hidden: this.isListEmpty()
    // });

    decorateClasses(childrenEl, {
      hidden: this.isListEmpty()
    });

    this.render();
  }

  update() {
    this.render();
  }

  render() {
    const { childrenEl, state: { mode, buttonDisabled } } = this;
    const {
      previousModeButtonImg,
      nextModeButtonImg
    } = this.owner.els;

    const { contextNodeIconUris } = this.context;

    // if (this.isListEmpty()) {
    //   // button should already be hidden -> now also hide list
    //   listEl.classList.add('hidden');
    // }
    if (!buttonDisabled && !this.isListEmpty()) {
      switch (mode) {
        case GraphNodeMode.ExpandChildren:
          childrenEl.classList.remove('hidden');
          break;
        case GraphNodeMode.ExpandSubgraph:
          childrenEl.classList.remove('hidden');
          break;
        case GraphNodeMode.Collapsed:
          // NOTE: cannot hide children if it has no button (for now)
          childrenEl.classList.add('hidden');
          break;
      }

      const previousMode = GraphNodeMode.previousValue(mode);
      const nextMode = GraphNodeMode.nextValue(mode);
      previousModeButtonImg.src = contextNodeIconUris[previousMode];
      nextModeButtonImg.src = contextNodeIconUris[nextMode];
      // previousModeButton.textContent = this.getModeIcon(previousMode);
      // nextModeButton.textContent = this.getModeIcon(nextMode);
      // previousModeButton.disabled = false;
      // nextModeButton.disabled = false;
      // if (previousMode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
      //   previousModeButton.disabled = true;
      // }
      // else if (nextMode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
      //   nextModeButton.disabled = true;
      // }
    }
  }

  getModeIcon(mode) {
    switch (mode) {
      case GraphNodeMode.ExpandChildren:
        return '-';
      case GraphNodeMode.ExpandSubgraph:
        return '☰';
      case GraphNodeMode.Collapsed:
        return '▷';
      default:
        return '';
    }
  }

  on = {
    previousModeButton: {
      focus(evt) { evt.target.blur(); }
    },
    nextModeButton: {
      focus(evt) { evt.target.blur(); }
    }
  }
}