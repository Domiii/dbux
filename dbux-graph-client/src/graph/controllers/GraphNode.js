import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

export default class GraphNode extends ClientComponentEndpoint {
  /**
   * Owner requirements:
   *  els `previousModeButton`
   *  els `previousModeButtonImg`
   *  els `nextModeButton`
   *  els `nextModeButtonImg`
   */
  init() {
    const {
      previousModeButton,
      nextModeButton
    } = this.owner.els;

    this.owner.el.classList.add('graph-node');

    // on click -> nextMode
    this.owner.dom.addEventListeners(this, true);

    previousModeButton?.addEventListener('click', (/* evt */) => {
      this.remote.previousMode();
    });

    nextModeButton?.addEventListener('click', (/* evt */) => {
      this.remote.nextMode();
    });
  }

  get childrenEl() {
    return this.owner.els.nodeChildren;
  }

  update() {
    this.render();
  }

  render() {
    const { childrenEl, state: { mode, hasChildren, buttonDisabled } } = this;
    const {
      previousModeButton,
      nextModeButton,
      previousModeButtonImg,
      nextModeButtonImg
    } = this.owner.els;

    const { contextNodeIconUris } = this.context;

    if (!buttonDisabled) {
      if (hasChildren) {
        switch (mode) {
          case GraphNodeMode.ExpandChildren:
            childrenEl.classList.remove('hidden');
            break;
          case GraphNodeMode.ExpandSubgraph:
            childrenEl.classList.remove('hidden');
            break;
          case GraphNodeMode.Collapsed:
            childrenEl.classList.add('hidden');
            break;
        }

        const previousMode = GraphNodeMode.previousValue(mode);
        const nextMode = GraphNodeMode.nextValue(mode);
        previousModeButtonImg.src = contextNodeIconUris[previousMode];
        nextModeButtonImg.src = contextNodeIconUris[nextMode];
        // previousModeButton.disabled = false;
        // nextModeButton.disabled = false;
        // if (previousMode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
        //   previousModeButton.disabled = true;
        // }
        // else if (nextMode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
        //   nextModeButton.disabled = true;
        // }
      }
      else {
        previousModeButton.classList.add('invisible');
        nextModeButton.classList.add('invisible');
      }
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