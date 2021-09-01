import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

export default class HighlightManager extends ClientComponentEndpoint {
  init() {
  }
  update() {
    // TODO-M: move to own GraphRoot
    const { highlightAmount } = this.state;
    if (highlightAmount > 0) {
      document.body.classList.add('highlight-on');
    } else {
      document.body.classList.remove('highlight-on');
    }
  }
}