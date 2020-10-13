import GraphDocument from './graph/GraphDocument';
import GraphComponents from './graph/_hostRegistry';
import HostWrapper from './HostWrapper';

export default class GraphHost extends HostWrapper {
  constructor() {
    super('Call Graph', GraphComponents, GraphDocument);
  }
}