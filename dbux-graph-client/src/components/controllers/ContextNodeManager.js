import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class ContextNodeManager extends ClientComponentEndpoint {
  // do nothing here, StaticContextHighlighting is trigger by:
  //  Client/ContextNode -> Host/ContextNode -> Host/ContextManager -> Host/Highlighter
  init() {
    // override init to make sure createEl is not triggered
  }
}