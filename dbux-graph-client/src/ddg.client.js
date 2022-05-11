import { startDbuxComponents } from './componentLib/ClientComponentManager';
import _clientRegistry from './ddg/_clientRegistry';

import './ddg/styles.css';

window.startDbuxComponents = startDbuxComponents.bind(null, _clientRegistry);
