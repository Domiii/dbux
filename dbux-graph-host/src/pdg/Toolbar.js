import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./PDGDocument").default } PDGDocument */

class Toolbar extends HostComponentEndpoint {
  init() {
  }

  /**
   * @type {PDGDocument}
   */
  get doc() {
    return this.parent;
  }

  public = {
    setLayoutAlgorithm(layoutType) {
      const result = this.doc.setDocumentMode({ layoutType });
      return result;
    },
    
    setGraphDocumentMode(update) {
      this.doc.setDocumentMode(update);
    },
  }
}

export default Toolbar;