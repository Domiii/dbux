import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class HiddenNodeManager extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   *  el `hiddenNode`
   */
  get hiddenNode() {
    return this.owner.els.hiddenNode;
  }

  init() {
    this.hiddenNode.classList.add('hidden');
  }

  update() {
    if (this.state.hiddenCount) {
      this.hiddenNode.classList.remove('hidden');
      this.hiddenNode.textContent = `${this.state.hiddenCount} nodes hidden`;
    }
    else {
      this.hiddenNode.classList.add('hidden');
    }
  }
}