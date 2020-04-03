import ClientComponentEndpoint from '../ClientComponentEndpoint';

class Toolbar extends ClientComponentEndpoint {
  initEl() {
    const el = document.createElement('ul');

    // TODO: add some buttons

    return el;
  }
}

export default Toolbar;