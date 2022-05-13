import DDGDocument from './dg/DDGDocument';
import DDGComponents from './dg/_hostRegistry';
import HostWrapper from './HostWrapper';

export default class DDGHost extends HostWrapper {
  constructor() {
    super('Data Dependency Graph', DDGComponents, DDGDocument);
  }
}
