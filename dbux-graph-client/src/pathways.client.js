import { startDbuxComponents } from './componentLib/ClientComponentManager';
import _clientRegistry from './pathways/_clientRegistry';

window.startDbuxComponents = startDbuxComponents.bind(null, _clientRegistry);