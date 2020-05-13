import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class HighlightManager extends ClientComponentEndpoint {
  init() {
  }
  update() {
    const { highlightAmount } = this.state;
    if (highlightAmount > 0) {
      document.body.style.background = '#666';
      document.body.classList.add('highlight-on');
    } else {
      document.body.style.background = 'white';
      document.body.classList.remove('highlight-on');
    }
  }
}