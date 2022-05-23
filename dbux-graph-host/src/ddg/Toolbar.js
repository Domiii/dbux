import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./DDGDocument").default } DDGDocument */

class Toolbar extends HostComponentEndpoint {
  init() {
  }

  /**
   * @type {DDGDocument}
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