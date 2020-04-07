import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');

    // complete reset
    el.innerHTML = '';
    
    return el;
  }
}

export default GraphDocument;