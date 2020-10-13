import PathwaysDocument from './pathways/PathwaysDocument';
import PathwaysComponents from './pathways/_hostRegistry';
import HostWrapper from './HostWrapper';

export default class PathwaysHost extends HostWrapper {
  constructor() {
    super('Pathways', PathwaysComponents, PathwaysDocument);
  }
}