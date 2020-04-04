import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  initEl() {
    const { body } = document;
    return body;
  }
}

export default GraphDocument;