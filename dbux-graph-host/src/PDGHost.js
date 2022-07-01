import PDGDocument from './pdg/PDGDocument';
import PDGComponents from './pdg/_hostRegistry';
import HostWrapper from './HostWrapper';

export default class PDGHost extends HostWrapper {
  constructor() {
    super('Progam Dependency Graph', PDGComponents, PDGDocument);
  }
}
