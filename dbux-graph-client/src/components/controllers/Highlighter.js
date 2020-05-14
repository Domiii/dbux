import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class Highlighter extends ClientComponentEndpoint {
  init() {
    this.owner.dom.addEventListeners(this);
  }


  update() {
    const { enabled } = this.state;
    const { el } = this.owner;

    if (enabled) {
      el.classList.add('highlight');
    } else {
      el.classList.remove('highlight');
    }
  }
}