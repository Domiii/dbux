import ClientComponentEndpoint from '../ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  initEl() {
    const { body } = document;
    return body;
  }
}

export default GraphDocument;