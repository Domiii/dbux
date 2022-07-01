import { startDbuxComponents } from './componentLib/ClientComponentManager';
import _clientRegistry from './pdg/_clientRegistry';

import './pdg/styles.css';

window.startDbuxComponents = startDbuxComponents.bind(null, _clientRegistry);
