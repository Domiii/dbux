import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

export default class HighlightManager extends ClientComponentEndpoint {
  init() {
  }
  update() {
    const { highlightAmount } = this.state;
    if (highlightAmount > 0) {
      this.parent.el.classList.add('highlight-on');
    } else {
      this.parent.el.classList.remove('highlight-on');
    }
  }
}