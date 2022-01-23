import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import { ImportsNode, RecordedPackagesNode } from './GlobalModulesNode';
import GlobalSearchNode from './GlobalSearchNode';

const GlobalNodeClasses = [
  GlobalErrorsNode,
  GlobalConsoleNode,
  
  RecordedPackagesNode,
  ImportsNode,

  GlobalDebugNode,
  GlobalSearchNode,
];

export default GlobalNodeClasses;
