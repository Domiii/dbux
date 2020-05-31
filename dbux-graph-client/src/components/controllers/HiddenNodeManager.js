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
  }

  update() {
    if (this.state.hideBeforeCount) {
      this.hiddenBeforeNode.classList.remove('hidden');
      this.hiddenBeforeNode.children[0].textContent = `${this.state.hideBeforeCount} nodes hidden`;
    }
    else {
      this.hiddenBeforeNode.classList.add('hidden');
    }

    if (this.state.hideAfterCount) {
      this.hiddenAfterNode.classList.remove('hidden');
      this.hiddenAfterNode.children[0].textContent = `${this.state.hideAfterCount} nodes hidden`;
    }
    else {
      this.hiddenAfterNode.classList.add('hidden');
    }
  }
}