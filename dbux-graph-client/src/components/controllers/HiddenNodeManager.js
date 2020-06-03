import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class HiddenNodeManager extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   *  el `hiddenBeforeNode`
   *  el `hiddenAfterNode`
   */
  get hiddenBeforeNode() {
    return this.owner.els.hiddenBeforeNode;
  }

  get hiddenAfterNode() {
    return this.owner.els.hiddenAfterNode;
  }

  init() {
    this.hiddenBeforeNode.classList.add('hidden');
    this.hiddenAfterNode.classList.add('hidden');

    this.hiddenBeforeNode.classList.add('cursor-pointer');
    this.hiddenAfterNode.classList.add('cursor-pointer');

    this.hiddenBeforeNode.setAttribute('data-tooltip', 'Click to unhide');
    this.hiddenAfterNode.setAttribute('data-tooltip', 'Click to unhide');

    this.owner.dom.addEventListeners(this);
  }

  update() {
    if (this.state.hideBeforeCount) {
      this.hiddenBeforeNode.classList.remove('hidden');
      this.hiddenBeforeNode.children[0].textContent = `Hiding ${this.state.hideBeforeCount} nodes`;
    }
    else {
      this.hiddenBeforeNode.classList.add('hidden');
    }

    if (this.state.hideAfterCount) {
      this.hiddenAfterNode.classList.remove('hidden');
      this.hiddenAfterNode.children[0].textContent = `Hiding ${this.state.hideAfterCount} nodes`;
    }
    else {
      this.hiddenAfterNode.classList.add('hidden');
    }
  }

  on = {
    hiddenBeforeNode: {
      click() {
        this.remote.hideBefore(false);
      }
    },
    hiddenAfterNode: {
      click() {
        this.remote.hideAfter(false);
      }
    }
  }
}