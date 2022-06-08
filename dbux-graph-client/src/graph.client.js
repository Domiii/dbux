import html2canvas from 'html2canvas';
import { startDbuxComponents } from './componentLib/ClientComponentManager';
import _clientRegistry from './graph/_clientRegistry';

import './graph/styles.css';


/**
 * hackfix for `screens.js`.
 * 
 * NOTE: We want to take screenshots without modifying too much code.
 * However, due to CSP limitations, we cannot load it dynamically.
 */
window.html2canvas = html2canvas;
// console.log('html2canvas', html2canvas);

window.startDbuxComponents = startDbuxComponents.bind(null, _clientRegistry);